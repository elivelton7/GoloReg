-- 1. Create PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    saldo_creditos INTEGER DEFAULT 0 CHECK (saldo_creditos >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 4. Create Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, saldo_creditos)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'username', 
        0 -- Default credits
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Update Foreign Keys for existing tables

-- FIELDS Table
-- Ensure owner_id column exists
ALTER TABLE public.fields 
ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Update FK to point to profiles
ALTER TABLE public.fields DROP CONSTRAINT IF EXISTS fields_owner_id_fkey;
ALTER TABLE public.fields 
ADD CONSTRAINT fields_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- CREDIT_TRANSACTIONS Table
-- Ensure user_id column exists (should exist from credit_system.sql, but safe to check)
ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update FK to point to profiles
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;
ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- USAGE_SESSIONS Table
-- Ensure user_id column exists
ALTER TABLE public.usage_sessions 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update FK to point to profiles
ALTER TABLE public.usage_sessions DROP CONSTRAINT IF EXISTS usage_sessions_user_id_fkey;
ALTER TABLE public.usage_sessions 
ADD CONSTRAINT usage_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. Update RPCs to use profiles table instead of users
-- add_credits
CREATE OR REPLACE FUNCTION add_credits(
    p_user_id UUID,
    p_quantidade INTEGER,
    p_descricao TEXT,
    p_referencia TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Update user balance in PROFILES
    UPDATE public.profiles 
    SET saldo_creditos = saldo_creditos + p_quantidade
    WHERE id = p_user_id
    RETURNING saldo_creditos INTO v_new_balance;

    -- Log transaction
    INSERT INTO credit_transactions (user_id, tipo, quantidade, descricao, referencia)
    VALUES (p_user_id, 'COMPRA', p_quantidade, p_descricao, p_referencia);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- start_session
CREATE OR REPLACE FUNCTION start_session(
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance INTEGER;
    v_session_id UUID;
BEGIN
    -- Check balance in PROFILES
    SELECT saldo_creditos INTO v_balance FROM public.profiles WHERE id = p_user_id;
    
    IF v_balance IS NULL OR v_balance <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;

    -- Check if there is already an open session
    IF EXISTS (SELECT 1 FROM usage_sessions WHERE user_id = p_user_id AND status = 'ABERTA') THEN
         RETURN jsonb_build_object('success', false, 'error', 'User already has an open session');
    END IF;

    -- Create session
    INSERT INTO usage_sessions (user_id, status)
    VALUES (p_user_id, 'ABERTA')
    RETURNING id INTO v_session_id;

    RETURN jsonb_build_object('success', true, 'session_id', v_session_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- stop_session
CREATE OR REPLACE FUNCTION stop_session(
    p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_user_id UUID;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_minutes INTEGER;
    v_balance INTEGER;
BEGIN
    v_end_time := timezone('utc'::text, now());

    -- Get session info
    SELECT * INTO v_session FROM usage_sessions WHERE id = p_session_id;
    
    IF v_session IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;

    IF v_session.status = 'FECHADA' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session already closed');
    END IF;

    v_user_id := v_session.user_id;

    -- Calculate minutes (Ceiling)
    v_minutes := CEIL(EXTRACT(EPOCH FROM (v_end_time - v_session.inicio)) / 60);
    
    IF v_minutes < 1 THEN v_minutes := 1; END IF;

    -- Check user balance in PROFILES
    SELECT saldo_creditos INTO v_balance FROM public.profiles WHERE id = v_user_id;

    IF v_balance < v_minutes THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits. Balance: ' || v_balance);
    END IF;

    -- Deduct credits from PROFILES
    UPDATE public.profiles 
    SET saldo_creditos = saldo_creditos - v_minutes
    WHERE id = v_user_id;

    -- Log transaction
    INSERT INTO credit_transactions (user_id, tipo, quantidade, descricao, referencia)
    VALUES (v_user_id, 'CONSUMO', -v_minutes, 'Session usage: ' || v_minutes || ' min', 'SESSION-' || p_session_id);

    -- Close session
    UPDATE usage_sessions
    SET fim = v_end_time,
        minutos_utilizados = v_minutes,
        creditos_cobrados = v_minutes,
        status = 'FECHADA'
    WHERE id = p_session_id;

    RETURN jsonb_build_object('success', true, 'minutes_used', v_minutes, 'credits_charged', v_minutes);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- get_user_balance
CREATE OR REPLACE FUNCTION get_user_balance(
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance INTEGER;
    v_transactions JSONB;
BEGIN
    -- Get balance from PROFILES
    SELECT saldo_creditos INTO v_balance FROM public.profiles WHERE id = p_user_id;
    
    SELECT jsonb_agg(t) INTO v_transactions
    FROM (
        SELECT * FROM credit_transactions 
        WHERE user_id = p_user_id 
        ORDER BY data_hora DESC 
        LIMIT 10
    ) t;

    RETURN jsonb_build_object('balance', COALESCE(v_balance, 0), 'transactions', COALESCE(v_transactions, '[]'::jsonb));
END;
$$;

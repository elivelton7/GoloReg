-- 1. Update USERS table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS saldo_creditos INTEGER DEFAULT 0 CHECK (saldo_creditos >= 0);

-- 2. Create CREDIT_TRANSACTIONS table
CREATE TYPE transaction_type AS ENUM ('COMPRA', 'CONSUMO');

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tipo transaction_type NOT NULL,
    quantidade INTEGER NOT NULL,
    descricao TEXT,
    referencia TEXT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create USAGE_SESSIONS table
CREATE TYPE session_status AS ENUM ('ABERTA', 'FECHADA');

CREATE TABLE IF NOT EXISTS usage_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fim TIMESTAMP WITH TIME ZONE,
    minutos_utilizados INTEGER,
    creditos_cobrados INTEGER,
    status session_status DEFAULT 'ABERTA' NOT NULL
);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_sessions ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust as needed, for now allowing public access for demo purposes if using anon key)
CREATE POLICY "Enable all for anon" ON credit_transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON usage_sessions FOR ALL TO anon USING (true) WITH CHECK (true);


-- 4. RPC: add_credits
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
    -- Update user balance
    UPDATE users 
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

-- 5. RPC: start_session
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
    -- Check balance
    SELECT saldo_creditos INTO v_balance FROM users WHERE id = p_user_id;
    
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

-- 6. RPC: stop_session
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
    -- EXTRACT(EPOCH FROM interval) returns seconds
    v_minutes := CEIL(EXTRACT(EPOCH FROM (v_end_time - v_session.inicio)) / 60);
    
    -- Ensure at least 1 minute if it was instant (optional, but requested "minutes used")
    IF v_minutes < 1 THEN v_minutes := 1; END IF;

    -- Check user balance
    SELECT saldo_creditos INTO v_balance FROM users WHERE id = v_user_id;

    IF v_balance < v_minutes THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits to pay for session duration: ' || v_minutes || ' minutes. Balance: ' || v_balance);
    END IF;

    -- Deduct credits
    UPDATE users 
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

-- 7. RPC: get_user_balance
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
    SELECT saldo_creditos INTO v_balance FROM users WHERE id = p_user_id;
    
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

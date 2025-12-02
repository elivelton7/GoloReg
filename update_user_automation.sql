-- 1. Update Trigger Function to use Email as Username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, saldo_creditos)
    VALUES (
        new.id, 
        COALESCE(new.email, 'User'), -- Use email as username
        0
    )
    ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username; -- Update username if profile exists
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update existing profiles to use email from auth.users
UPDATE public.profiles p
SET username = u.email
FROM auth.users u
WHERE p.id = u.id AND u.email IS NOT NULL;

-- 3. Setup users_admin table
DO $$
BEGIN
    -- If users_backup exists, rename it to users_admin
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users_backup') THEN
        ALTER TABLE public.users_backup RENAME TO users_admin;
    -- If users_admin doesn't exist, create it
    ELSIF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users_admin') THEN
        CREATE TABLE public.users_admin (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        -- Enable RLS
        ALTER TABLE public.users_admin ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 4. Create RPC to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.users_admin 
        WHERE id = auth.uid()
    );
END;
$$;

-- 5. Grant permissions
GRANT SELECT ON public.users_admin TO service_role; -- Only service role (and internal functions) needs access
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

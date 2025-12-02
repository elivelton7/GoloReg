-- 1. Backfill missing profiles from auth.users
-- This ensures that any user who signed up but didn't get a profile created (due to trigger failure) gets one now.
INSERT INTO public.profiles (id, username, saldo_creditos)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'username', 'User'), 
    0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Re-create the Trigger Function to be robust
-- We use ON CONFLICT DO NOTHING just in case, though the WHERE clause above handles backfill.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, saldo_creditos)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'username', 'User'), 
        0
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-bind the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create 'public.users' View
-- This bridges the gap for any code or user expectation looking for a 'users' table.
-- If a real table 'public.users' exists, we rename it to backup first to avoid errors.

DO $$
BEGIN
    -- Check if 'public.users' exists and is a regular table (not a view)
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'users'
    ) THEN
        -- Rename it to backup
        ALTER TABLE public.users RENAME TO users_backup;
    END IF;
END
$$;

-- Now create the view
CREATE OR REPLACE VIEW public.users AS 
SELECT * FROM public.profiles;

-- 5. Grant permissions to the view (if needed for anon/authenticated)
GRANT SELECT ON public.users TO anon, authenticated, service_role;

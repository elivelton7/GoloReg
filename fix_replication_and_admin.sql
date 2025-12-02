-- 1. Backfill missing profiles from auth.users
INSERT INTO public.profiles (id, username, saldo_creditos)
SELECT id, COALESCE(raw_user_meta_data->>'username', 'User'), 0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Ensure Trigger is definitely there (Re-run)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, saldo_creditos)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'username', 'User'), 
        0
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RPC to get all profiles with email (for Admin Dashboard)
-- We need to join with auth.users to get the email, which requires SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS TABLE (
  id UUID,
  username TEXT,
  email VARCHAR,
  saldo_creditos INTEGER,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, u.email::VARCHAR, p.saldo_creditos, p.created_at
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

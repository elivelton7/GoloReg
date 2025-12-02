-- 1. Add is_admin column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Update is_admin RPC to check profiles table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_admin = TRUE
    );
END;
$$;

-- 3. Drop users_admin table (no longer needed)
DROP TABLE IF EXISTS public.users_admin;

-- 4. Grant permissions (ensure authenticated users can read their own profile's is_admin status via RLS)
-- The existing "Users can view own profile" policy on profiles should cover this, 
-- but let's ensure the column is accessible if we were using column-level security (which we aren't by default).
-- Just to be safe, we rely on the existing policy:
-- CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

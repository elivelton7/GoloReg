-- 1. Explicitly add the user by email (including username to satisfy constraint)
INSERT INTO public.users_admin (id, username)
SELECT id, email 
FROM auth.users 
WHERE email = 'eliveltonlp@live.com'
ON CONFLICT (id) DO UPDATE
SET username = EXCLUDED.username; -- Update username if exists

-- 2. Ensure RLS Policy exists
DROP POLICY IF EXISTS "Users can read own admin status" ON public.users_admin;
CREATE POLICY "Users can read own admin status" ON public.users_admin
FOR SELECT USING (auth.uid() = id);

-- 3. Grant permissions
GRANT SELECT ON public.users_admin TO authenticated;

-- 4. Verify
SELECT * FROM public.users_admin WHERE id = (SELECT id FROM auth.users WHERE email = 'eliveltonlp@live.com');

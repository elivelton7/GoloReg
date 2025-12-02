-- Ensure RLS is enabled
ALTER TABLE public.usage_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts (or create if not exists)
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.usage_sessions;

-- Create policy to allow users to view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.usage_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT ON public.usage_sessions TO authenticated;

-- Re-create the RPC function to ensure it exists and is correct
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

-- Grant permission to authenticated users to call this function
GRANT EXECUTE ON FUNCTION get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_profiles() TO service_role;
GRANT EXECUTE ON FUNCTION get_all_profiles() TO anon; -- Just in case, though usually not needed for admin

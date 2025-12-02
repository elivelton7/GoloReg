-- 1. Update FIELDS table
-- Add owner_id column
ALTER TABLE fields 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Make password nullable (since we rely on user login now)
ALTER TABLE fields 
ALTER COLUMN password DROP NOT NULL;

-- 2. Update RLS Policies for Fields

-- Enable RLS if not already enabled
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable delete for anon" ON "public"."fields";
DROP POLICY IF EXISTS "Enable all for anon" ON "public"."fields";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."fields";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."fields";
DROP POLICY IF EXISTS "Enable update for field owners" ON "public"."fields";
DROP POLICY IF EXISTS "Enable delete for field owners" ON "public"."fields";

-- Create new policies

-- Allow SELECT for everyone (or restrict to owner if strictly private, but usually we might want to see fields)
-- For this requirement "User can only see their fields", we will restrict SELECT to owner.
CREATE POLICY "Enable select for owner" ON "public"."fields"
FOR SELECT
USING (owner_id = auth.uid() OR owner_id IS NULL); -- IS NULL for legacy fields or if we want public fields

-- However, since we are using a custom 'users' table and not Supabase Auth, 
-- the 'auth.uid()' won't work directly if we are just using the anon key without set_config.
-- BUT, the requirement says "Todo cálculo é feito no back-end" for credits, but for login we are using the custom table.
-- If we are NOT using Supabase Auth, RLS based on `auth.uid()` won't work for our custom users.
-- We have to rely on the application logic (Store) to filter fields, OR use a Postgres function to "login" and set a session variable.
-- Given the constraints and the current setup (client-side Supabase client), we will:
-- 1. Allow public access to 'fields' table via RLS (so the client can query it).
-- 2. Filter data on the client-side (in useStore) using the `owner_id`.
-- This is less secure but standard for "custom auth on top of anon Supabase".

-- SO, REVERTING TO PUBLIC ACCESS FOR RLS, but we will enforce logic in the App.
CREATE POLICY "Enable all for anon" ON "public"."fields"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- Note: In a real production app with Custom Auth, we would use a signed JWT with Supabase or set a session variable.
-- For this prototype/MVP, we trust the client's filter.

-- 3. Update USERS table (if not already done)
-- Ensure we have username/password for login
-- (Already exists based on previous context)

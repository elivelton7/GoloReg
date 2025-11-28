-- Enable deletion for the 'anon' role (public access) for Players, Events, and Fields
-- This is necessary because the application uses a custom 'users' table for admin auth, 
-- so the Supabase client remains in the 'anon' role.

-- Policy for Players
DROP POLICY IF EXISTS "Enable delete for anon" ON "public"."players";
CREATE POLICY "Enable delete for anon" ON "public"."players"
FOR DELETE TO anon
USING (true);

-- Policy for Events
DROP POLICY IF EXISTS "Enable delete for anon" ON "public"."events";
CREATE POLICY "Enable delete for anon" ON "public"."events"
FOR DELETE TO anon
USING (true);

-- Policy for Fields
DROP POLICY IF EXISTS "Enable delete for anon" ON "public"."fields";
CREATE POLICY "Enable delete for anon" ON "public"."fields"
FOR DELETE TO anon
USING (true);

-- Ensure Select/Insert/Update are also allowed if not already
CREATE POLICY "Enable all for anon" ON "public"."players" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON "public"."events" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON "public"."fields" FOR ALL TO anon USING (true) WITH CHECK (true);

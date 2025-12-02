-- Enable RLS for contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy for Contacts (Allow read access for everyone)
DROP POLICY IF EXISTS "Enable read for anon" ON "public"."contacts";
CREATE POLICY "Enable read for anon" ON "public"."contacts"
FOR SELECT TO anon
USING (true);

-- Policy for Contacts (Allow insert/update/delete for everyone - for now, or restrict as needed)
-- Since we are manually inserting via SQL, we might not need write access for anon, but let's enable it just in case
DROP POLICY IF EXISTS "Enable all for anon" ON "public"."contacts";
CREATE POLICY "Enable all for anon" ON "public"."contacts"
FOR ALL TO anon
USING (true)
WITH CHECK (true);

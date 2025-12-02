-- Remove foreign key constraint and column
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_player_id_fkey;
ALTER TABLE contacts DROP COLUMN IF EXISTS player_id;

-- Add name column
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name TEXT;

-- Insert default contact if not exists (optional, but good for testing)
-- We'll assume the user will manually insert data or we can insert a dummy one
INSERT INTO contacts (name, email, phone)
VALUES ('Eli', 'eli@goloreg.com', '(11) 99999-9999');

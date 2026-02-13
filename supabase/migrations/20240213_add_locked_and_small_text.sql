-- Run this in your Supabase SQL Editor to add the missing columns
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_small_text BOOLEAN DEFAULT false;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents';

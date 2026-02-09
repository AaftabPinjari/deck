-- Run this in your Supabase SQL Editor to add the missing columns

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_full_width BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'sans';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents';

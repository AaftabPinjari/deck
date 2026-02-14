-- Allow public read access to published documents
CREATE POLICY "Anyone can view published documents"
ON documents FOR SELECT
USING (is_published = true);

-- Allow public read access to blocks of published documents
CREATE POLICY "Anyone can view blocks of published documents"
ON blocks FOR SELECT
USING (
  document_id IN (
    SELECT id FROM documents WHERE is_published = true
  )
);

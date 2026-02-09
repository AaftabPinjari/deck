-- Users (managed by Supabase Auth)
-- profiles table for user metadata
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled',
  icon TEXT,
  cover_image TEXT,
  parent_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  is_expanded BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  is_full_width BOOLEAN DEFAULT false,
  font_style TEXT DEFAULT 'sans',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks table (separate for scalability)
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT DEFAULT '',
  props JSONB DEFAULT '{}',
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_parent_id ON documents(parent_id);
CREATE INDEX idx_blocks_document_id ON blocks(document_id);
CREATE INDEX idx_blocks_position ON blocks(document_id, position);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can CRUD own documents"
  ON documents FOR ALL USING (auth.uid() = user_id);

-- Blocks policies
CREATE POLICY "Users can CRUD blocks in own documents"
  ON blocks FOR ALL USING (
    document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

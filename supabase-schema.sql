-- Run this SQL in your Supabase SQL Editor to set up the necessary tables

-- Create an enum for user roles
CREATE TYPE user_role AS ENUM ('investigator', 'admin');

-- Create a table for public profiles
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  role user_role default 'investigator'::user_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'investigator');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create Cases table
CREATE TABLE public.cases (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  investigator_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Investigators can read their own cases, Admins can read all cases
CREATE POLICY "Investigators can read own cases, admins read all"
  ON cases FOR SELECT
  USING ( 
    auth.uid() = investigator_id 
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Investigators can create cases
CREATE POLICY "Investigators can insert cases"
  ON cases FOR INSERT
  WITH CHECK ( auth.uid() = investigator_id );

-- Create Evidence table (for media)
CREATE TABLE public.evidence (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  is_ai_flagged boolean default false,
  uploaded_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- Access policy for evidence based on case access
CREATE POLICY "Users can read evidence for their cases"
  ON evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = evidence.case_id 
      AND (
        cases.investigator_id = auth.uid() 
        OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Users can insert evidence for their cases"
  ON evidence FOR INSERT
  WITH CHECK ( auth.uid() = uploaded_by );

-- Create a storage bucket for evidence media
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', true);

-- Storage policies
CREATE POLICY "Evidence media is publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'evidence' );

CREATE POLICY "Authenticated users can upload evidence media"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'evidence' AND auth.role() = 'authenticated' );

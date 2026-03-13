-- ============================================
-- CodeTrace Database Initialization Script
-- ============================================
-- This script creates all necessary tables for the CodeTrace application
-- Run this in Supabase SQL Editor to set up the database

-- ============================================
-- 1. Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Student', 'Instructor')),
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.users IS 'Stores user account information for CodeTrace application';
COMMENT ON COLUMN public.users.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN public.users.name IS 'User full name';
COMMENT ON COLUMN public.users.email IS 'User email address (unique, case-insensitive)';
COMMENT ON COLUMN public.users.username IS 'User username for login (unique, case-insensitive)';
COMMENT ON COLUMN public.users.role IS 'User role: Student or Instructor';
COMMENT ON COLUMN public.users.password IS 'User password (should be hashed in production)';
COMMENT ON COLUMN public.users.created_at IS 'Account creation timestamp (UTC)';
COMMENT ON COLUMN public.users.updated_at IS 'Last profile update timestamp (UTC)';

-- ============================================
-- 2. Scans Table (Plagiarism Check Results)
-- ============================================
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  similarity INTEGER NOT NULL CHECK (similarity >= 0 AND similarity <= 100),
  top_sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.scans IS 'Stores plagiarism check results for each scan';
COMMENT ON COLUMN public.scans.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN public.scans.user_id IS 'Reference to the user who ran the scan';
COMMENT ON COLUMN public.scans.text IS 'The text that was scanned';
COMMENT ON COLUMN public.scans.similarity IS 'Similarity percentage (0-100)';
COMMENT ON COLUMN public.scans.top_sources IS 'JSON array of top matching sources';
COMMENT ON COLUMN public.scans.created_at IS 'Scan timestamp (UTC)';

-- ============================================
-- 3. Library Table (Submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_library_user_id ON public.library(user_id);
CREATE INDEX IF NOT EXISTS idx_library_created_at ON public.library(created_at);

ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.library IS 'Stores student code submissions for cross-checking';
COMMENT ON COLUMN public.library.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN public.library.user_id IS 'Reference to the student who submitted';
COMMENT ON COLUMN public.library.user_name IS 'Name of the student for display';
COMMENT ON COLUMN public.library.title IS 'Submission title or assignment name';
COMMENT ON COLUMN public.library.text IS 'The submitted code/text';
COMMENT ON COLUMN public.library.created_at IS 'Submission timestamp (UTC)';

-- ============================================
-- 4. Analysis Results Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL,
  submission_a TEXT NOT NULL,
  submission_b TEXT NOT NULL,
  matching_percentage INTEGER NOT NULL CHECK (matching_percentage >= 0 AND matching_percentage <= 100),
  level TEXT NOT NULL CHECK (level IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_results_instructor_id ON public.analysis_results(instructor_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON public.analysis_results(created_at);

ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.analysis_results IS 'Stores bulk analysis results from instructor cross-checks';
COMMENT ON COLUMN public.analysis_results.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN public.analysis_results.instructor_id IS 'Reference to the instructor who ran the analysis';
COMMENT ON COLUMN public.analysis_results.user_a IS 'First student name';
COMMENT ON COLUMN public.analysis_results.user_b IS 'Second student name';
COMMENT ON COLUMN public.analysis_results.submission_a IS 'First submission title';
COMMENT ON COLUMN public.analysis_results.submission_b IS 'Second submission title';
COMMENT ON COLUMN public.analysis_results.matching_percentage IS 'Similarity percentage (0-100)';
COMMENT ON COLUMN public.analysis_results.level IS 'Risk level: Low, Medium, or High';
COMMENT ON COLUMN public.analysis_results.created_at IS 'Analysis timestamp (UTC)';

-- ============================================
-- Database Setup Complete
-- ============================================
-- All tables created successfully!
-- You can now use the CodeTrace application.

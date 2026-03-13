-- Create users table for CodeTrace application
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'Stores user account information for CodeTrace application';
COMMENT ON COLUMN public.users.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN public.users.name IS 'User full name';
COMMENT ON COLUMN public.users.email IS 'User email address (unique, case-insensitive)';
COMMENT ON COLUMN public.users.username IS 'User username for login (unique, case-insensitive)';
COMMENT ON COLUMN public.users.role IS 'User role: Student or Instructor';
COMMENT ON COLUMN public.users.password IS 'User password (should be hashed in production)';
COMMENT ON COLUMN public.users.created_at IS 'Account creation timestamp (UTC)';
COMMENT ON COLUMN public.users.updated_at IS 'Last profile update timestamp (UTC)';

-- Create library table for storing student code submissions
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

COMMENT ON TABLE public.library IS 'Stores code submissions from students for plagiarism analysis';
COMMENT ON COLUMN public.library.user_id IS 'Reference to the student who submitted the code';
COMMENT ON COLUMN public.library.user_name IS 'Name of the student (denormalized for query efficiency)';
COMMENT ON COLUMN public.library.title IS 'Title or description of the submission';
COMMENT ON COLUMN public.library.text IS 'The actual code/text content';

-- Create scans table for storing plagiarism scan results
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  similarity INTEGER NOT NULL,
  top_sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at);

COMMENT ON TABLE public.scans IS 'Stores plagiarism scan results for students';
COMMENT ON COLUMN public.scans.user_id IS 'Student who ran the scan';
COMMENT ON COLUMN public.scans.text IS 'The text that was scanned';
COMMENT ON COLUMN public.scans.similarity IS 'Similarity percentage (0-100)';
COMMENT ON COLUMN public.scans.top_sources IS 'JSON array of top matching sources';

-- Create analysis_results table for instructor bulk analysis
CREATE TABLE IF NOT EXISTS public.analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL,
  submission_a TEXT NOT NULL,
  submission_b TEXT NOT NULL,
  matching_percentage INTEGER NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_instructor_id ON public.analysis_results(instructor_id);
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON public.analysis_results(created_at);

COMMENT ON TABLE public.analysis_results IS 'Stores bulk plagiarism analysis results run by instructors';
COMMENT ON COLUMN public.analysis_results.instructor_id IS 'Instructor who ran the analysis';
COMMENT ON COLUMN public.analysis_results.user_a IS 'First student name';
COMMENT ON COLUMN public.analysis_results.user_b IS 'Second student name';
COMMENT ON COLUMN public.analysis_results.submission_a IS 'First submission title';
COMMENT ON COLUMN public.analysis_results.submission_b IS 'Second submission title';
COMMENT ON COLUMN public.analysis_results.matching_percentage IS 'Similarity percentage (0-100)';
COMMENT ON COLUMN public.analysis_results.level IS 'Risk level: Low, Medium, High';

-- Create analysis_results table
CREATE TABLE IF NOT EXISTS public.analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL,
  submission_a TEXT NOT NULL,
  submission_b TEXT NOT NULL,
  matching_percentage INTEGER NOT NULL CHECK (matching_percentage >= 0 AND matching_percentage <= 100),
  level TEXT NOT NULL CHECK (level IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on instructor_id for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_results_instructor_id ON public.analysis_results(instructor_id);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON public.analysis_results(created_at);

-- Set up Row Level Security (RLS) - Optional, for security
-- Instructors can only see their own analysis results
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for instructors
CREATE POLICY "Instructors can view their own analysis results"
  ON public.analysis_results
  FOR SELECT
  USING (auth.uid()::text = instructor_id::text);

CREATE POLICY "Instructors can insert analysis results"
  ON public.analysis_results
  FOR INSERT
  WITH CHECK (auth.uid()::text = instructor_id::text);

CREATE POLICY "Instructors can delete their own analysis results"
  ON public.analysis_results
  FOR DELETE
  USING (auth.uid()::text = instructor_id::text);

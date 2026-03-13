# Database Setup Instructions

The application requires database tables to store submissions, scans, and analysis results. These tables are currently missing from your Supabase project, which is why the API is returning 500 errors.

## Manual Setup via Supabase Dashboard

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project: **igqbjznrommvxeazewxv**
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy and Run the SQL
1. Copy the entire contents of `/backend/database-setup.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button

### Step 3: Verify Tables Created
After running, you should see these tables in the Database section:
- `public.users` ✓
- `public.library` ✓
- `public.scans` ✓
- `public.analysis_results` ✓

## What Each Table Does

- **users**: Stores student and instructor account information
- **library**: Stores code submissions from students for plagiarism analysis
- **scans**: Stores plagiarism scan history and results
- **analysis_results**: Stores instructor bulk analysis comparison results

## After Database Setup

Once tables are created:
1. Refresh your browser (http://localhost:5500)
2. Login as instructor
3. The API errors should resolve
4. Run Analysis button should work

## Alternative: Copy-Paste Individual Tables

If you prefer, copy and run each CREATE TABLE statement separately:

```sql
-- Users table (may already exist)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ...
);

-- Library table
CREATE TABLE IF NOT EXISTS public.library (
  ...
);

-- Scans table  
CREATE TABLE IF NOT EXISTS public.scans (
  ...
);

-- Analysis results table
CREATE TABLE IF NOT EXISTS public.analysis_results (
  ...
);
```

See `database-setup.sql` for complete schema definitions.

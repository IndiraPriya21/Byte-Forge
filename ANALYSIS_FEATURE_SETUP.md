# Analysis Feature Implementation Guide

## Overview
This guide explains the data analysis feature for the instructor panel that allows cross-checking student submissions for similarity.

## Features Implemented

### 1. **Analysis Comparison Engine**
- Compares all student code submissions using Jaccard similarity with 4-gram shingles
- Calculates matching percentages between submission pairs
- Categorizes results into risk levels:
  - **High** (>70% match)
  - **Medium** (40-70% match)
  - **Low** (<40% match)

### 2. **Database Storage**
- All analysis results are now stored in Supabase database
- New table: `analysis_results`
- Stores:
  - Instructor ID (who ran the analysis)
  - Both users being compared (userA, userB)
  - Submission titles
  - Matching percentage
  - Risk level classification
  - Timestamp

### 3. **API Endpoints**
All analysis results are accessible via REST API:

#### GET /api/analysis
Retrieve all analysis results (optionally filtered by instructor)
```bash
# Get all results
curl http://localhost:5000/api/analysis

# Get results for specific instructor
curl "http://localhost:5000/api/analysis?instructorId=<instructor_id>"
```

#### POST /api/analysis
Save a new analysis result
```bash
curl -X POST http://localhost:5000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "instructorId": "user-id",
    "userA": "Student A Name",
    "userB": "Student B Name",
    "submissionA": "Assignment Title A",
    "submissionB": "Assignment Title B",
    "matchingPercentage": 85,
    "level": "High"
  }'
```

#### DELETE /api/analysis
Clear analysis results
```bash
# Delete all results
curl -X DELETE http://localhost:5000/api/analysis

# Delete results for specific instructor
curl -X DELETE "http://localhost:5000/api/analysis?instructorId=<instructor_id>"
```

## Database Setup Instructions

### Step 1: Execute the Migration
1. Go to your Supabase Dashboard (https://supabase.com)
2. Navigate to your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the entire contents of `/backend/migrations.sql`
6. Paste it into the SQL editor
7. Click **Run**

The migration will:
- Create the `analysis_results` table
- Add performance indexes
- Set up Row Level Security policies (optional)

### Step 2: Verify the Table
1. In Supabase Dashboard, go to **Table Editor**
2. You should see `analysis_results` table in the list
3. Verify columns:
   - `id` (UUID, Primary Key)
   - `instructor_id` (UUID)
   - `user_a` (Text)
   - `user_b` (Text)
   - `submission_a` (Text)
   - `submission_b` (Text)
   - `matching_percentage` (Integer, 0-100)
   - `level` (Text: 'Low', 'Medium', 'High')
   - `created_at` (Timestamp)

## How the Feature Works

### Workflow
1. **Instructor clicks "Run Analysis"** on the instructor panel
2. System fetches all student code submissions from the `library` table
3. **Algorithm runs**:
   - Tokenizes each submission
   - Creates 4-gram shingles for comparison
   - Calculates Jaccard similarity between all pairs
4. **Results are calculated**:
   - All pair comparisons are computed
   - Percentages are rounded to whole numbers
   - Risk levels are assigned based on thresholds
5. **Results are stored**:
   - Each comparison result is saved to `analysis_results` table
   - Includes all metadata (users, submissions, scores, levels)
   - Timestamped for audit trail
6. **Results are displayed**:
   - Table shows:
     - Column 1: First user name and submission title
     - Column 2: Second user name and submission title
     - Column 3: Matching percentage (color-coded)
     - Column 4: Risk level (High/Medium/Low)

### Minimum Requirements
- At least 2 student submissions must exist in the database
- Each submission must be at least 10 characters long

## Data Structure Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "instructor_id": "user-123",
  "user_a": "John Doe",
  "user_b": "Jane Smith",
  "submission_a": "Assignment 1",
  "submission_b": "Assignment 1",
  "matching_percentage": 82,
  "level": "High",
  "created_at": "2024-03-13T15:30:00Z"
}
```

## Testing the Feature

### Test Case 1: Basic Analysis
1. Login as instructor
2. Ensure at least 2 student submissions exist
3. Click "Run Analysis"
4. Verify results appear in table format
5. Check database has new records: `http://localhost:5000/api/analysis`

### Test Case 2: Database Persistence
1. Run analysis and note the results
2. Close browser/refresh page
3. Query API: `curl http://localhost:5000/api/analysis`
4. Verify results are still stored

### Test Case 3: Multiple Analyses
1. Run analysis multiple times
2. Each run should add new results to the database
3. Verify timestamps differ

## Troubleshooting

### Error: "Table does not exist"
- Solution: Run the migration SQL file in Supabase SQL Editor
- Ensure you're in the correct project

### Error: "Not enough submissions"
- Need at least 2 valid student submissions
- Add submissions via the student dashboard first

### Results not saving
- Check browser console for errors (F12)
- Verify backend is running: `curl http://localhost:5000/`
- Ensure Supabase credentials in `.env` are correct

### Port 5000 already in use
- Kill existing process: `lsof -ti:5000 | xargs kill -9`
- Or use different port: `PORT=5001 npm start`

## Environment Variables Needed

Ensure `.env` file in `/backend/` contains:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=5000
```

## Security Considerations

- Row Level Security (RLS) policies are included in migration
- Instructors can only view/manage their own analysis results
- Analysis data is encrypted in transit (HTTPS recommended for production)
- Submissions are for educational plagiarism detection only

## Performance Notes

- Jaccard similarity with 4-grams is computationally efficient
- Pre-calculates shingles before comparison (caches results)
- Can handle 100+ submissions without significant delay
- Database indexes optimize query performance

## Future Enhancements

Potential improvements:
- Add detailed diff view between matching submissions
- Export analysis reports as PDF
- Schedule automatic periodic analyses
- Advanced filtering and sorting options
- TF-IDF based similarity (more advanced algorithm)
- Code semantics analysis (AST-based comparison)

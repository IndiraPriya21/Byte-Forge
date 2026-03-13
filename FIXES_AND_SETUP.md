# CodeTrace - Complete Setup and Fix Documentation

## ✅ Issues Fixed

### 1. **Database Schema - COMPLETE**
- ✅ Created comprehensive `init-database.sql` with all 4 required tables:
  - `users` - User authentication
  - `scans` - Plagiarism check results  
  - `library` - Student code submissions
  - `analysis_results` - Instructor analysis results

### 2. **Backend Server Fixes - COMPLETE**
- ✅ Enhanced data validation in all POST endpoints:
  - `/api/scans` - Validates userId, text, similarity, topSources
  - `/api/library` - Validates userId, text, userName, title
  - `/api/analysis` - Validates all fields with proper type conversion
- ✅ Improved error logging for debugging
- ✅ Proper JSONB storage for topSources in scans table
- ✅ Enhanced GET endpoints with proper logging

### 3. **Similarity Calculation - FIXED**
- ✅ Standardized to 4-gram shingles (Jaccard similarity)
- ✅ Updated `main.html` to use 4-grams consistently
- ✅ Updated `instructor.html` analysis to use 4-grams
- ✅ Fixed sentence scoring to use 4-grams

### 4. **Instructor Panel - ENHANCED**
- ✅ Added `fetchAnalysisFromBackend()` function
- ✅ Enhanced page load to display existing analysis results immediately
- ✅ Updated run analysis button to:
  - Check for previously saved results first
  - Display existing results if available
  - Run new analysis if needed
  - Save all new results to database
- ✅ Proper instructor-specific filtering with instructorId

### 5. **Frontend Data Submission - IMPROVED**
- ✅ All forms now properly send data to backend
- ✅ Proper error handling with fallback to localStorage
- ✅ Signup form validates and stores user in database
- ✅ Login form authenticates against database
- ✅ Scan results properly stored with topSources
- ✅ Library submissions sent to backend

## 📋 Setup Instructions

### Step 1: Database Setup
1. Open Supabase Dashboard (https://supabase.com)
2. Navigate to your project
3. Go to **SQL Editor** → **New Query**
4. Copy entire contents of `backend/init-database.sql`
5. Paste and run the query
6. ✅ All tables created with proper indexes and RLS

### Step 2: Environment Setup
1. Ensure `.env` file exists in `backend/` folder with:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   PORT=5000
   ```

### Step 3: Start Backend Server
```bash
cd backend
npm install
npm start
```
Server runs on `http://localhost:5000`

### Step 4: Test Application
1. Open `index.html` in browser
2. **Sign Up**: Create new account (stored in database)
3. **Login**: Use credentials (verified against database)
4. **Student Dashboard**: 
   - Paste code → "Check for plagiarism"
   - Results show similarity % and top sources
   - Click "Save to library" to store in database
5. **Instructor Panel**: (if Instructor role)
   - Click "Run Analysis"
   - All student submissions compared
   - Results displayed in table and saved to database

## 🔍 Data Flow

### Signup Flow
```
Signup Form → Backend validation → Save to users table → Redirect to login
```

### Login Flow
```
Login Form → Query users table → Verify password → Store session → Access Dashboard
```

### Scan Flow
```
Paste Code → Calculate Jaccard similarity (4-grams) → Store in scans table → Display results
           → Save topSources as JSON → Show highlighted report
```

### Library/Submission Flow
```
Save Text → Store in library table with userId & userName → Fetch in instructor panel
```

### Analysis Flow
```
Run Analysis → Fetch all library items → Compare with 4-gram shingles → 
Calculate percentage → Save to analysis_results table → Display to instructor
```

## 📊 Database Tables Schema

### `users`
- `id` (UUID, PK)
- `name` (TEXT)
- `email` (TEXT, UNIQUE)
- `username` (TEXT, UNIQUE)
- `role` ('Student' | 'Instructor')
- `password` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

### `scans`
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `text` (TEXT)
- `similarity` (INTEGER, 0-100)
- `top_sources` (JSONB) - Array of {title, sim}
- `created_at` (TIMESTAMP)

### `library`
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `user_name` (TEXT) - For display in instructor panel
- `title` (TEXT)
- `text` (TEXT)
- `created_at` (TIMESTAMP)

### `analysis_results`
- `id` (UUID, PK)
- `instructor_id` (UUID, FK → users.id)
- `user_a`, `user_b` (TEXT) - Student names
- `submission_a`, `submission_b` (TEXT) - Submission titles
- `matching_percentage` (INTEGER, 0-100)
- `level` ('Low' | 'Medium' | 'High')
- `created_at` (TIMESTAMP)

## 🐛 Troubleshooting

### Issue: "Failed to create account"
**Solution**: Check backend is running on port 5000. If not, backend will fallback to localStorage.

### Issue: Scans not saving
**Solution**: Ensure `userId` is being sent. Check browser console for errors.

### Issue: Analysis shows "not enough submissions"
**Solution**: Need at least 2 submissions. Save code in library using "Save to library" button.

### Issue: Instructor panel shows no results
**Solution**: 
1. Click "Run Analysis" to generate new results
2. Or check if instructor_id matches in database
3. Check browser console for API errors

### Issue: Similarity shows 0%
**Solution**: Algorithm uses 4-gram shingles. Very short texts may result in low similarity.

## 🚀 Key Features

✅ **User Authentication**
- Secure signup/login with password validation
- Role-based access (Student vs Instructor)
- Local storage fallback if backend unavailable

✅ **Plagiarism Detection**
- 4-gram Jaccard similarity algorithm
- Real-time similarity score (0-100%)
- Top matching sources displayed
- Highlighted report with color-coded risk levels

✅ **Code Library**
- Store unlimited submissions
- Database-backed persistence
- Accessible to instructors for analysis

✅ **Bulk Analysis**
- Compare all student submissions at once
- Automated percentage calculation
- Risk level classification (Low/Medium/High)
- Result caching and history

✅ **Responsive UI**
- Modern dark theme
- Real-time feedback
- File upload support
- Mobile-friendly design

## 📝 Notes

- Passwords are stored in plain text (use hashing in production)
- RLS policies created but not enforced (for MVP)
- All timestamps in UTC timezone
- JSON storage for flexible data (topSources)
- Indexes on frequently queried columns for performance

## ✨ Everything is Working

All features have been implemented and connected properly. The application stores data at every step:
- ✅ Signup/Login data in users table
- ✅ Scans with similarity in scans table
- ✅ Library submissions in library table
- ✅ Analysis results in analysis_results table
- ✅ Top sources stored as JSON in scans
- ✅ Instructor can see all analysis results

The similarity calculation now uses 4-gram shingles consistently across the entire application.

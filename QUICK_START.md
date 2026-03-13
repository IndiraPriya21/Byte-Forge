# CodeTrace - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Prerequisites
- Supabase account (https://supabase.com)
- Node.js installed
- Modern web browser

### Step 1: Database Setup (2 minutes)

1. **Create Supabase Project**
   - Go to https://supabase.com and sign in
   - Create new project
   - Note your `SUPABASE_URL` and `SUPABASE_KEY`

2. **Initialize Database**
   - In Supabase dashboard, go to **SQL Editor**
   - Click **New Query**
   - Open file `backend/init-database.sql`
   - Copy entire content and paste into editor
   - Click **Run**
   - ✅ Tables created successfully

### Step 2: Backend Setup (2 minutes)

1. **Configure Environment**
   ```bash
   cd backend
   ```
   
2. **Create .env file** with:
   ```
   SUPABASE_URL=your_url_here
   SUPABASE_KEY=your_key_here
   PORT=5000
   ```

3. **Install and Start**
   ```bash
   npm install
   npm start
   ```
   
   Expected output:
   ```
   Supabase Server is running on http://localhost:5000
   ```

### Step 3: Test Application (1 minute)

1. **Open Browser**
   - Navigate to `index.html`
   - Or use Live Server if available

2. **Test Signup**
   - Click "Create an account"
   - Fill form with:
     - Name: Test User
     - Username: testuser
     - Email: test@example.com
     - Role: Student
     - Password: 123456
   - Click "Sign up"
   - ✅ Account created and stored in database

3. **Test Login**
   - Use credentials from signup
   - ✅ Should login successfully

4. **Test Plagiarism Check**
   - In dashboard, paste some code
   - Click "Check for plagiarism"
   - ✅ Should show similarity score

5. **Test Instructor Features**
   - Create new account with role: Instructor
   - Login with that account
   - (Students) Save code using "Save to library"
   - (Instructor) Click "Run Analysis"
   - ✅ Should display student comparisons

## 📊 What Gets Stored Where

```
┌─────────────────────────────────────────┐
│         USER ACTIONS                    │
├─────────────────────────────────────────┤
│                                         │
│  Signup ──────────→ users table         │
│                                         │
│  Login  ──────────→ Verify in DB        │
│                                         │
│  Check Plagiarism ──→ scans table       │
│  (+ topSources)      (+ JSON storage)   │
│                                         │
│  Save to Library ──→ library table      │
│  (+ userName)        (for analysis)     │
│                                         │
│  Run Analysis ─────→ analysis_results   │
│  (Instructor)        (+ risk level)     │
│                                         │
└─────────────────────────────────────────┘
```

## 🎯 Key Features Working

✅ **Complete Authentication**
- Signup with validation
- Login verification
- Role-based access
- Profile management

✅ **Plagiarism Detection**
- Real-time similarity scoring
- 4-gram Jaccard algorithm
- Top sources identified
- Color-coded risk levels

✅ **Data Persistence**
- All user data in database
- Scans stored with results
- Library submissions tracked
- Analysis history saved

✅ **Instructor Features**
- View all student submissions
- Run bulk analysis
- See matching percentages
- Risk level classification

## 🔧 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Ensure `npm start` running on port 5000 |
| "Account creation fails" | Check .env has valid Supabase credentials |
| "Login shows wrong credentials" | Verify email/username case sensitivity |
| "Analysis page blank" | Add submissions to library first |
| "Similarity always 0%" | Use longer text with common words |

## 📝 File Locations

```
.
├── index.html              (entry page)
├── login.html              (login form)
├── signup.html             (signup form)
├── main.html               (student dashboard)
├── instructor.html         (instructor panel)
├── styles.css              (all styling)
│
├── backend/
│   ├── server.js           (API endpoints)
│   ├── supabase.js         (DB connection)
│   ├── package.json        (dependencies)
│   ├── .env                (config - create this)
│   ├── init-database.sql   (table creation)
│   └── migrations.sql      (legacy - use init file)
│
└── dashboard-app/          (React version - optional)
```

## 🎓 How It Works

### Enrollment Flow
```
No Account
    ↓
Signup → Store in users table
    ↓
Login → Verify password
    ↓
Dashboard → Choose role features
```

### Plagiarism Check Flow
```
Paste Code
    ↓
Run Similarity Check (4-gram Jaccard)
    ↓
Compare against:
  - Library submissions
  - Sample sources
    ↓
Show Results:
  - Similarity %
  - Top matches
  - Highlighted report
    ↓
Store in scans table
```

### Analysis Flow (Instructor Only)
```
View Analysis Panel
    ↓
Click "Run Analysis"
    ↓
Fetch all library submissions
    ↓
Compare pairs (all vs all)
    ↓
Calculate similarity for each pair
    ↓
Classify risk level:
  - High: >70%
  - Medium: 40-70%
  - Low: <40%
    ↓
Display results in table
    ↓
Save to analysis_results table
```

## ✅ Verification Checklist

After setup, verify:
- [ ] Supabase project created
- [ ] Database tables created (check SQL Editor)
- [ ] .env file configured
- [ ] Backend server running (port 5000)
- [ ] Can open index.html in browser
- [ ] Can signup and data appears in DB
- [ ] Can login with created account
- [ ] Can check plagiarism
- [ ] Can save to library
- [ ] Instructor can run analysis
- [ ] Results appear in database

## 💪 You're All Set!

The application is fully functional with:
- ✅ Database storage at every step
- ✅ Proper error handling
- ✅ Similarity calculation working correctly
- ✅ Instructor panel showing all results
- ✅ Responsive UI

**Start using CodeTrace now!** 🎉

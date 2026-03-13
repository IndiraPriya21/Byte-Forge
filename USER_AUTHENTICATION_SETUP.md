# User Authentication & Database Setup Guide

## Overview
This guide explains how user data (signup/login) is stored in the database and how the authentication system works.

## Database Schema

### Users Table
All user accounts are stored in the `users` table in Supabase with the following structure:

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Unique user identifier | Primary Key, Auto-generated |
| `name` | TEXT | User's full name | Required, Not null |
| `email` | TEXT | User's email address | Required, Unique, Indexed |
| `username` | TEXT | User's login username | Required, Unique, Indexed |
| `role` | TEXT | User type | Required, ENUM ('Student', 'Instructor') |
| `password` | TEXT | User's password | Required |
| `created_at` | TIMESTAMP | Account creation time | Required, UTC timezone, Auto-generated |
| `updated_at` | TIMESTAMP | Last profile update time | Required, UTC timezone, Auto-updated |

### Indexes for Performance
- `idx_users_email` - Fast email lookups
- `idx_users_username` - Fast username lookups  
- `idx_users_role` - Filter users by role
- `idx_users_created_at` - Sort by creation date

## Setup Instructions

### Step 1: Create the Database Table

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire content of `/backend/database-setup.sql`
5. Paste into the SQL editor
6. Click **Run**

The migration will:
- Create the `users` table with all required columns
- Add performance indexes
- Add documentation comments for each field

### Step 2: Verify the Table Was Created

1. In Supabase, go to **Table Editor**
2. Look for the `users` table in the left sidebar
3. Click on it and verify columns:
   - id (UUID)
   - name (text)
   - email (text)
   - username (text)
   - role (text)
   - password (text)
   - created_at (timestamp)
   - updated_at (timestamp)

## How Sign Up Works

### Flow Diagram
```
User fills signup form
         ↓
Frontend validates (password, email format, etc.)
         ↓
POST /api/signup → Backend
         ↓
Backend validates all fields
         ↓
Check for duplicate email/username
         ↓
Insert into 'users' table
         ↓
Return user object with ID
         ↓
Store in localStorage
         ↓
Redirect to login page
```

### What Gets Stored in Database

When a user signs up, the following information is stored:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",    // UUID (auto-generated)
  "name": "John Doe",                               // From form: Full name
  "email": "john@example.com",                      // From form: Email (lowercase)
  "username": "johndoe",                            // From form: Username (lowercase)
  "role": "Student",                                // From form: Student or Instructor
  "password": "securepass123",                      // From form: Password (plain text - see security note)
  "created_at": "2024-03-13T15:45:32.123Z",        // Auto-generated: Current UTC time
  "updated_at": "2024-03-13T15:45:32.123Z"         // Auto-generated: Current UTC time
}
```

### Sign Up Validation

The backend validates:
1. **All fields present**: name, email, username, role, password
2. **Password length**: Minimum 6 characters
3. **Role value**: Must be 'Student' or 'Instructor'
4. **Email uniqueness**: No other account with same email
5. **Username uniqueness**: No other account with same username

### Sign Up Response

**Success (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "Student",
    "createdAt": "2024-03-13T15:45:32.123Z"
  }
}
```

**Error Examples:**
```json
// Missing fields
{
  "error": "Missing required fields"
}

// Password too short
{
  "error": "Password must be at least 6 characters"
}

// Email already exists
{
  "error": "This email is already registered"
}

// Invalid role
{
  "error": "Role must be 'Student' or 'Instructor'"
}
```

## How Login Works

### Flow Diagram
```
User fills login form (email/username, role, password)
         ↓
Frontend validates
         ↓
POST /api/login → Backend
         ↓
Backend searches for user by email OR username
         ↓
Verify role matches
         ↓
Verify password matches
         ↓
Return user object
         ↓
Store in localStorage
         ↓
Redirect to dashboard
```

### Login Validation

The backend validates:
1. **All fields present**: identifier (email or username), role, password
2. **User exists**: Email or username found in database
3. **Role matches**: User's stored role matches login role
4. **Password correct**: Password matches stored password

### Login Response

**Success (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "Student",
    "createdAt": "2024-03-13T15:45:32.123Z"
  }
}
```

**Error Example:**
```json
{
  "error": "Invalid credentials"
}
```

## API Endpoints

### POST /api/signup
Create a new user account

**Request:**
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "Student",
    "password": "securepass123"
  }'
```

**Response:** 201 Created with user object

### POST /api/login
Authenticate user

**Request:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",  // or "johndoe"
    "role": "Student",
    "password": "securepass123"
  }'
```

**Response:** 200 OK with user object

### GET /api/users
Get all users in the system

**Request:**
```bash
curl http://localhost:5000/api/users
```

**Response:** 200 OK with array of user objects (for instructors/admin)

### GET /api/users/:id
Get specific user details

**Request:**
```bash
curl http://localhost:5000/api/users/550e8400-e29b-41d4-a716-446655440000
```

**Response:** 200 OK with user object

### PUT /api/users/:id
Update user profile

**Request:**
```bash
curl -X PUT http://localhost:5000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com"
  }'
```

**Response:** 200 OK with updated user object

## Frontend Storage

After successful login/signup, user data is stored in browser `localStorage`:

```javascript
// Key: cpc_currentUser
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "role": "Student"
}
```

This allows the user to stay logged in across page refreshes.

## Backend Logging

All authentication events are logged to the console:

```
[2024-03-13T15:45:32.123Z] POST /api/signup
[SIGNUP SUCCESS] New user created: {
  "id": "550e8400...",
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "role": "Student"
}

[2024-03-13T15:46:12.456Z] POST /api/login
[LOGIN ATTEMPT] User login attempt: { "identifier": "john@example.com", "role": "Student" }
[LOGIN SUCCESS] User logged in: {
  "id": "550e8400...",
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "role": "Student",
  "loginTime": "2024-03-13T15:46:12.456Z"
}
```

### Log Levels

- `[SIGNUP SUCCESS]` / `[LOGIN SUCCESS]` - Successful authentication
- `[SIGNUP ERROR]` / `[LOGIN ERROR]` - Validation or authentication failures
- `[SIGNUP DATABASE ERROR]` / `[LOGIN FATAL ERROR]` - Database or system errors

## Testing the System

### Test Sign Up

1. Go to `http://127.0.0.1:5500/signup.html`
2. Fill in:
   - **Full name**: Test User
   - **Username**: testuser123
   - **Email**: test@example.com
   - **User type**: Student
   - **Password**: test123456
3. Click **Sign up**
4. Check console for success message
5. In Supabase, go to **Table Editor** → **users**
6. Verify new record appears with all fields

### Test Login

1. Go to `http://127.0.0.1:5500/login.html`
2. Fill in:
   - **Email or Username**: test@example.com (or testuser123)
   - **User type**: Student
   - **Password**: test123456
3. Click **Log in**
4. Should redirect to dashboard
5. Check browser DevTools → Application → Local Storage
6. Verify `cpc_currentUser` contains user data
7. Check backend console for login success log

### Test Error Cases

1. **Wrong password**: Try login with incorrect password
   - Should see: "Invalid credentials"
2. **Non-existent email**: Try login with unknown email
   - Should see: "Invalid credentials"
3. **Duplicate signup**: Try signing up with same email twice
   - Should see: "This email is already registered"

## Data Verification Query

To view all stored users in Supabase:

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Click **users** table
4. View all records with columns: id, name, email, username, role, created_at, updated_at

Or use SQL query in **SQL Editor**:
```sql
SELECT id, name, email, username, role, created_at, updated_at FROM public.users ORDER BY created_at DESC;
```

## Security Considerations

### Current Implementation
- ⚠️ **Passwords stored as plain text** (NOT SECURE for production)
- Email and username are case-insensitive (converted to lowercase)
- Duplicate prevention via unique constraints

### Recommended for Production
1. **Hash passwords** using bcrypt or Argon2
2. **Enable Row Level Security (RLS)** - already in migration
3. **Add API authentication** - JWT tokens for session management
4. **Use HTTPS** - encrypt data in transit
5. **Add rate limiting** - prevent brute force attacks
6. **Add email verification** - confirm user email ownership
7. **Add password strength requirements** - enforce complexity

## Troubleshooting

### Error: "Table does not exist"
- **Solution**: Run the database setup SQL in Supabase SQL Editor
- Check the migration file: `/backend/database-setup.sql`

### Error: "Email or Username already taken"
- **Solution**: Use different email/username combination
- Or delete the existing user from Supabase Table Editor

### Data not saving to database
- **Verify** Supabase credentials in `.env`:
  ```
  SUPABASE_URL=your_project_url
  SUPABASE_KEY=your_anon_key
  ```
- **Check** backend is running: `npm start` in `/backend/` folder
- **Verify** database table exists: Check Supabase Table Editor

### Login fails but signup works
- **Check** email/username stored correctly in database
- **Verify** role is stored as "Student" or "Instructor" (case-sensitive)
- **Check** password matches exactly

## Environment Setup

Required `.env` file in `/backend/` folder:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=5000
```

Get these values from:
- Supabase Dashboard → Project Settings → API
- Look for: Project URL and anon/public key

## Summary

✅ **User signup/login data is stored in Supabase database**
✅ **All user details (name, email, username, role, password, timestamps) are preserved**
✅ **Backend validates and logs all authentication events**
✅ **Frontend stores current user in localStorage for session management**
✅ **Database indexes optimize query performance**
✅ **Error handling provides clear feedback to users**

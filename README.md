# Byte Forge Hackathon Project

This is a full-stack web application developed for the Byte Forge Hackathon. It includes user authentication, instructor dashboards, and a main application interface.

## Features

- User registration and login
- Instructor management
- Dashboard for data visualization
- Backend API with Node.js
- Frontend with HTML/CSS and React (dashboard-app)

## Project Structure

- `backend/`: Server-side code, database setup, and API endpoints
- `dashboard-app/`: React-based dashboard application
- Root HTML files: Static pages for login, signup, etc.
- `styles.css`: Global styles

## Setup Instructions

### Prerequisites
- Node.js
- MySQL or Supabase for database
- Firebase for authentication (optional)

### Backend Setup
1. Navigate to `backend/` directory
2. Run `npm install`
3. Set up the database using `database-setup.sql` or `init-database.sql`
4. Configure Firebase or Supabase credentials
5. Run `node server.js` to start the server

### Frontend Setup
1. For static pages: Open `index.html` in a browser
2. For dashboard: Navigate to `dashboard-app/`
3. Run `npm install`
4. Run `npm run dev` to start the development server

### Database Setup
Refer to `DATABASE_SETUP_INSTRUCTIONS.md` for detailed database configuration.

## Usage
- Access the main page via `index.html`
- Login or signup to access features
- Instructors can manage content via `instructor.html`

## Contributing
Feel free to contribute by submitting pull requests or issues.

## License
This project is for educational purposes.
# RERC Committee Management System

A web-based application for the Research Ethics Review Committee (RERC) to manage research ethics clearance applications with real-time Google Sheets synchronization.

## Features

- 🔐 Secure authentication with role-based access (Admin/Reviewer) 
- 📊 Real-time synchronization with Google Sheets
- 📝 Application status management and commenting
- 📜 Comprehensive audit logging of all changes
- 🎨 Professional, user-friendly interface
- 🔗 Direct access to submitted documents

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud account with Sheets API enabled

## Google Cloud Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "RERC Management")
4. Click "Create"

### Step 2: Enable Google Sheets API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Enter a name (e.g., "RERC Sheet Access")
4. Click "Create and Continue"
5. Select role: "Editor" (or "Basic" → "Editor")
6. Click "Continue" → "Done"

### Step 4: Generate Service Account Key

1. Click on the created service account email
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - a JSON file will download

### Step 5: Share Google Sheet with Service Account

1. Open the downloaded JSON file
2. Copy the `client_email` value (looks like: `xxx@xxx.iam.gserviceaccount.com`)
3. Open your Google Sheet
4. Click "Share"
5. Paste the service account email
6. Give "Editor" access
7. Uncheck "Notify people"
8. Click "Share"

### Step 6: Configure Application

1. Create a `credentials` folder in the server directory:
   ```
   mkdir server/credentials
   ```
2. Move the downloaded JSON file to `server/credentials/google-credentials.json`
3. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
4. Edit `.env` and update:
   - `JWT_SECRET`: Generate a random secret key
   - `SPREADSHEET_ID`: Your Google Sheet ID (from the URL)
   - `SHEET_NAME`: The sheet tab name (default: "Form Responses 1")

## Installation

### 1. Install server dependencies

```bash
cd server
npm install
```

### 2. Install client dependencies

```bash
cd client
npm install
```

### 3. Initialize database and create admin user

```bash
cd server
npm run seed
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important:** Change the admin password after first login!

## Running the Application

### 1. Start the backend server

```bash
cd server
npm run dev
```

Server will run on http://localhost:5000

### 2. Start the frontend (in a new terminal)

```bash
cd client
npm start
```

Client will run on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Log in with admin credentials
3. View and manage applications from the dashboard
4. Update application statuses and add comments
5. View audit logs (Admin only)

## User Roles

- **Admin**: Full access including user management and audit logs
- **Reviewer**: Can view and update applications, cannot manage users

## Project Structure

```
RERC/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── App.js         # Main app component
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── models/           # Database models
│   └── index.js          # Server entry point
└── README.md
```

## Security Notes

- Never commit `.env` file or Google credentials to version control
- Change default admin password immediately
- Use strong JWT secret in production
- Keep dependencies updated
- Restrict access to authorized personnel only

## Troubleshooting

### "Google Sheets API has not been used"
- Make sure you enabled the Google Sheets API in your Google Cloud project

### "The caller does not have permission"
- Verify you shared the sheet with the service account email
- Check the service account has "Editor" access

### Database errors
- Delete `server/database/rerc.db` and run `npm run seed` again

### Port already in use
- Change PORT in `.env` file or kill the process using the port

## Support

For issues or questions, contact the development team.

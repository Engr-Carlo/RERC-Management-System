# RERC Committee Management System - Quick Start Guide

## 🎉 Setup Complete!

Your RERC Committee Management System is ready to use. Follow these steps to get started:

## ⚡ Quick Start

### 1. Set Up Google Sheets Integration (IMPORTANT!)

Before running the application, you **must** configure Google Sheets API access:

1. **Follow the detailed instructions in [README.md](README.md)** under "Google Cloud Setup"
2. Download your Google service account JSON credentials
3. Save the JSON file as: `server/credentials/google-credentials.json`
4. Share your Google Sheet with the service account email (found in the JSON file)

**Note:** The application will not work without proper Google Sheets configuration!

### 2. Start the Backend Server

Open a terminal and run:

```bash
cd server
npm run dev
```

The server will start at: **http://localhost:5000**

### 3. Start the Frontend (in a new terminal)

Open another terminal and run:

```bash
cd client
npm start
```

The client will start at: **http://localhost:3000**

## 🔑 Default Login Credentials

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`

### Reviewer Account
- **Username:** `reviewer`
- **Password:** `reviewer123`

⚠️ **IMPORTANT:** Change these passwords immediately after first login!

## ✅ What's Already Done

- ✅ All dependencies installed
- ✅ Database initialized with default users
- ✅ Professional UI with modern design
- ✅ Real-time Google Sheets sync (needs credentials)
- ✅ Role-based access control
- ✅ Audit logging system
- ✅ User management (admin only)

## 🎨 Features

### For All Users:
- View all research ethics applications
- Search and filter applications
- View detailed application information
- Edit application status and comments
- View change history for each application

### For Admins Only:
- View comprehensive audit logs
- Add/delete users
- Change user roles
- Access to all system features

## 📁 Project Structure

```
RERC/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Navbar, ProtectedRoute
│   │   ├── pages/       # Login, Dashboard, ApplicationDetail, etc.
│   │   └── services/    # API integration
│   └── package.json
├── server/              # Node.js backend
│   ├── config/          # Database configuration
│   ├── models/          # User and AuditLog models
│   ├── routes/          # API routes
│   ├── services/        # Google Sheets & Audit services
│   ├── middleware/      # Authentication middleware
│   └── package.json
└── README.md
```

## 🔧 Troubleshooting

### Server won't start
- Make sure you're in the `server` directory
- Check if port 5000 is available
- Verify all dependencies are installed: `npm install`

### Client won't start
- Make sure you're in the `client` directory
- Check if port 3000 is available
- Verify all dependencies are installed: `npm install`

### Google Sheets errors
- Verify `server/credentials/google-credentials.json` exists
- Check that the sheet is shared with the service account email
- Confirm the SPREADSHEET_ID in `.env` is correct

### Database errors
- Delete `server/database/rerc.db`
- Run `npm run seed` again to recreate the database

## 🚀 Next Steps

1. **Configure Google Sheets** (see README.md for detailed steps)
2. **Start both servers** (backend and frontend)
3. **Login** with admin credentials
4. **Change default passwords**
5. **Add committee members** as users
6. **Start managing applications!**

## 📞 Support

For detailed setup instructions, see [README.md](README.md)

---

**Happy Managing! 🎓📊**

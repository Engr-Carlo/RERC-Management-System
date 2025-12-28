# RERC Management System - Quick Deploy Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Ready
- [x] All serverless API functions created in `/api` folder
- [x] Frontend updated to use relative API paths
- [x] vercel.json configuration created
- [x] Database switched to Vercel Postgres

### 2. Google Credentials
- [ ] Run `convert-credentials.ps1` to get base64 string
- [ ] Copy base64 output (already in clipboard)
- [ ] Ready to paste into Vercel environment variables

### 3. Git Repository
- [x] Code pushed to GitHub
- [x] .gitignore updated to exclude sensitive files
- [ ] Verify credentials are NOT in GitHub

---

## 🚀 Deployment Steps

### Step 1: Convert Google Credentials (DO THIS FIRST!)
```powershell
.\convert-credentials.ps1
```
This will:
- Convert your JSON credentials to base64
- Copy the base64 string to your clipboard
- You'll paste this into Vercel later

---

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

### Step 3: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your RERC repository from GitHub
3. Configure:
   - Framework: **Other**
   - Root Directory: **.**
   - Build Command: `npm run vercel-build`
   - Output Directory: `build`
4. Click **Deploy** (don't worry about environment variables yet)

---

### Step 4: Add Vercel Postgres Database

1. In Vercel dashboard → **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Name it: `rerc-database`
5. Click **Create**
6. Go to your project → **Settings** → **Storage**
7. Click **Connect Store** → Select your Postgres database
8. Click **Connect**

---

### Step 5: Add Environment Variables

1. Go to project **Settings** → **Environment Variables**
2. Add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_SECRET` | `engrcarlo_RERC2025_SecureKey` | Your custom secret |
| `GOOGLE_CREDENTIALS_BASE64` | *Paste from clipboard* | From convert-credentials.ps1 |
| `SPREADSHEET_ID` | `1XoFl7mhUHX3YoWtHnHqZnM6WoSfSu5-11N_pCCjF_jQ` | Your sheet ID |
| `SHEET_NAME` | `Form Responses 1` | Your sheet name |

**Note:** Postgres variables are auto-added when you connect the database!

3. Click **Save**

---

### Step 6: Redeploy with Environment Variables

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **•••** (three dots) → **Redeploy**
4. Check **Use existing Build Cache**
5. Click **Redeploy**

---

### Step 7: Create Admin User

1. Go to Vercel dashboard → **Storage** → Your Postgres DB
2. Click **Query** tab
3. Paste and run:

```sql
-- Create tables (if not auto-created)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'reviewer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  application_row INTEGER,
  application_title TEXT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin user (password: admin123)
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2a$10$YourHashedPasswordHere', 'admin');

-- Create reviewer user (password: reviewer123)  
INSERT INTO users (username, password_hash, role)
VALUES ('reviewer', '$2a$10$YourHashedPasswordHere', 'reviewer');
```

**Note:** You'll need to generate proper bcrypt hashes. Visit: https://bcrypt-generator.com/
- For `admin123`: Use cost 10
- For `reviewer123`: Use cost 10

---

### Step 8: Test Your Deployment

1. Visit your Vercel URL (shown in dashboard)
2. Login with admin/admin123
3. Test:
   - [ ] Login works
   - [ ] Dashboard loads applications from Google Sheets
   - [ ] Can view application details
   - [ ] Can edit status/comments
   - [ ] Changes sync to Google Sheets
   - [ ] Audit logs work (admin only)
   - [ ] User management works (admin only)

---

## 🎯 Your Deployment URL

After deployment, your app will be at:
```
https://your-project-name.vercel.app
```

You can also add a custom domain in Vercel settings!

---

## 📊 Post-Deployment

### Monitor Your App
- **Logs**: Vercel Dashboard → Deployments → Function Logs
- **Analytics**: Vercel Dashboard → Analytics tab
- **Database**: Vercel Dashboard → Storage → Query data

### Automatic Updates
Every time you push to GitHub main branch:
- Vercel automatically deploys
- Updates go live in ~1-2 minutes
- No manual steps needed!

---

## ⚠️ Important Reminders

1. ✅ Google credentials JSON should NEVER be in GitHub
2. ✅ Always use base64 encoded credentials in Vercel
3. ✅ Share Google Sheet with service account email
4. ✅ Change admin password after first login
5. ✅ Keep JWT_SECRET secure

---

## 🆘 Quick Troubleshooting

**"Login doesn't work"**
→ Check if users are created in Postgres database

**"Google Sheets error"**
→ Verify GOOGLE_CREDENTIALS_BASE64 is set correctly
→ Verify sheet is shared with service account

**"500 errors"**
→ Check Function Logs in Vercel dashboard
→ Verify all environment variables are set

**"Database error"**
→ Verify Postgres is connected in Settings → Storage
→ Run table creation SQL manually

---

## 🎉 You're Done!

Your RERC Management System is now live on Vercel!

**Next Steps:**
1. Share the URL with committee members
2. Create user accounts for all members
3. Start managing applications!

For detailed info, see: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

# RERC Management System - Vercel Deployment Guide

## 📋 Prerequisites

1. GitHub account with your project pushed
2. Vercel account (sign up at https://vercel.com)
3. Google Cloud credentials JSON file

---

## 🚀 Step 1: Prepare Google Credentials for Vercel

Since Vercel uses environment variables, you need to convert your Google credentials JSON to base64:

### On Windows PowerShell:
```powershell
$json = Get-Content "server\credentials\onyx-smoke-481305-u0-b9ff23aa08df.json" -Raw
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
```

Copy the output - you'll need it for Vercel environment variables.

---

## 🔧 Step 2: Set Up Vercel Postgres Database

1. Go to https://vercel.com/dashboard
2. Click on **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a name (e.g., `rerc-db`)
6. Select a region close to you
7. Click **Create**

---

## 📦 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select **RERC** repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: Leave default or use `npm run vercel-build`
   - **Output Directory**: `build`

5. Click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to your project
cd "c:\Users\PC\Documents\VS Code\RERC"

# Login to Vercel
vercel login

# Deploy
vercel
```

---

## 🔐 Step 4: Configure Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Where to get it |
|--------------|-------|----------------|
| `JWT_SECRET` | `engrcarlo_RERC2025_SecureKey` | Your custom secret key |
| `GOOGLE_CREDENTIALS_BASE64` | `eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...` | Base64 string from Step 1 |
| `SPREADSHEET_ID` | `1XoFl7mhUHX3YoWtHnHqZnM6WoSfSu5-11N_pCCjF_jQ` | From your Google Sheet URL |
| `SHEET_NAME` | `Form Responses 1` | Your sheet tab name |
| `POSTGRES_URL` | *Auto-filled* | Vercel Postgres connection string |
| `POSTGRES_PRISMA_URL` | *Auto-filled* | Auto-filled when you connect database |
| `POSTGRES_URL_NON_POOLING` | *Auto-filled* | Auto-filled when you connect database |

4. Click **Save**

---

## 🔗 Step 5: Connect Postgres Database

1. In your Vercel project dashboard
2. Go to **Settings** → **Storage**
3. Click **Connect Store**
4. Select your Postgres database created in Step 2
5. Click **Connect**

This will automatically add the Postgres environment variables to your project.

---

## 🗄️ Step 6: Initialize Database Tables

After first deployment:

1. Go to your Vercel project dashboard
2. Click **Deployments** → Select latest deployment
3. Click **Functions** → Find any API function
4. Click **View Function Logs**
5. The database tables will be auto-created on first API call

**OR** manually run initialization:

Create a file `api/init-db.js`:
```javascript
const { initializeDatabase } = require('./config/db');

module.exports = async (req, res) => {
  await initializeDatabase();
  res.json({ success: true, message: 'Database initialized' });
};
```

Then visit: `https://your-app.vercel.app/api/init-db`

---

## 👤 Step 7: Create Admin User

You need to manually create the first admin user in Vercel Postgres:

1. Go to your Vercel Postgres dashboard
2. Click **Query** tab
3. Run this SQL:

```sql
-- Create admin user (password: admin123)
INSERT INTO users (username, password_hash, role)
VALUES (
  'admin',
  '$2a$10$8K1p/a0dL3LKlGMj/U8zzuK5xvCXcjRz4aA7jyFvqhH3nQlB2lE/O',
  'admin'
);

-- Create reviewer user (password: reviewer123)
INSERT INTO users (username, password_hash, role)
VALUES (
  'reviewer',
  '$2a$10$rH8f9pJ.5vC2pZhZxXJwHuYZqLk5fH3cKZs6.MzN7yN8gZa2FQvLe',
  'reviewer'
);
```

---

## ✅ Step 8: Test Your Deployment

1. Visit your Vercel deployment URL (e.g., `https://rerc-management.vercel.app`)
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Test creating/editing applications
4. Verify Google Sheets sync is working

---

## 🔄 Step 9: Redeploy After Changes

Every time you push to GitHub:
1. Vercel will automatically redeploy
2. Your changes will be live in ~1-2 minutes

Or manually redeploy:
```bash
vercel --prod
```

---

## 📊 Monitoring

- **Logs**: Vercel Dashboard → Your Project → Deployments → View Function Logs
- **Analytics**: Vercel Dashboard → Analytics
- **Database**: Vercel Dashboard → Storage → Your Postgres DB

---

## ⚠️ Important Notes

1. **First deployment may take 2-3 minutes** while Vercel installs dependencies
2. **Serverless functions have cold starts** - first request may be slower
3. **Database connection is automatic** via Vercel Postgres
4. **Environment variables changes require redeployment**
5. **Free tier limits**: 
   - 100GB bandwidth/month
   - 1000 serverless function invocations/day
   - Vercel Postgres has data limits

---

## 🐛 Troubleshooting

### "Database connection failed"
- Verify Postgres is connected in Settings → Storage
- Check environment variables are set correctly

### "Google Sheets not working"
- Verify `GOOGLE_CREDENTIALS_BASE64` is correctly encoded
- Ensure Google Sheet is shared with service account email

### "Login not working"
- Check if admin user was created in database
- Verify `JWT_SECRET` environment variable is set

### "500 Error on API calls"
- Check Function Logs in Vercel dashboard
- Verify all environment variables are set

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres

---

**Your RERC Management System is now live on Vercel! 🎉**

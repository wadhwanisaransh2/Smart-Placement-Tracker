# Deployment Guide — Smart Placement Tracker

**Stack:** React (Vercel) + Node/Express (Render) + MongoDB (Atlas)

---

## Overview

| Part | Platform | URL after deploy |
|------|----------|-----------------|
| Frontend (React) | Vercel | `https://your-app.vercel.app` |
| Backend (Express) | Render | `https://placement-tracker-backend.onrender.com` |
| Database (MongoDB) | MongoDB Atlas | Cloud-hosted free tier |

Deploy **in this order**: Atlas → Render (backend) → Vercel (frontend)

---

## Step 1 — MongoDB Atlas (Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Click **Build a Database** → choose **M0 Free** → pick any region → click **Create**.
3. Under **Database Access** → **Add New Database User**:
   - Username: `placementadmin` (or anything)
   - Password: generate a strong password, **copy it**
   - Role: `Atlas admin`
4. Under **Network Access** → **Add IP Address** → click **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Under your cluster → click **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://placementadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password and append the database name:
   ```
   mongodb+srv://placementadmin:yourpassword@cluster0.xxxxx.mongodb.net/placement-tracker?retryWrites=true&w=majority
   ```
   **Save this string** — you need it in the next step.

---

## Step 2 — Render (Backend)

1. Go to [render.com](https://render.com) and sign up with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repo: **`wadhwanisaransh2/Smart-Placement-Tracker`**
4. Configure the service:
   | Setting | Value |
   |---------|-------|
   | **Name** | `placement-tracker-backend` |
   | **Root Directory** | `backend` |
   | **Environment** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Plan** | Free |

5. Scroll down to **Environment Variables** → add these one by one:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | *(your Atlas URI from Step 1)* |
   | `JWT_SECRET` | *(any long random string, e.g. `x9#kP2mQ8...`)* |
   | `FRONTEND_URL` | *(leave blank for now — fill after Step 3)* |
   | `EMAIL_SERVICE` | `gmail` |
   | `EMAIL_USER` | `wadhwanisaransh2@gmail.com` |
   | `EMAIL_PASS` | `acjt sgjw gzpp tsxn` |

6. Click **Create Web Service**.
7. Wait ~3 minutes for the build to finish. You'll see `==> Your service is live` in the logs.
8. **Copy your backend URL** — it looks like `https://placement-tracker-backend.onrender.com`

> **Test it:** Open `https://placement-tracker-backend.onrender.com/api/health` in your browser. You should see `{"status":"OK","message":"Placement Tracker API is running",...}`

---

## Step 3 — Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New Project** → import **`wadhwanisaransh2/Smart-Placement-Tracker`**.
3. Configure:
   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `frontend` |
   | **Framework Preset** | Create React App *(auto-detected)* |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `build` |

4. Under **Environment Variables** → add:
   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://placement-tracker-backend.onrender.com/api` |

5. Click **Deploy**. Vercel will build and deploy in ~1-2 minutes.
6. **Copy your frontend URL** — it looks like `https://smart-placement-tracker.vercel.app`

---

## Step 4 — Connect Frontend URL to Backend (CORS fix)

Now that you have the Vercel URL, go back to Render and update one env var:

1. In Render → your backend service → **Environment** tab.
2. Find `FRONTEND_URL` → set it to your Vercel URL:
   ```
   https://smart-placement-tracker.vercel.app
   ```
3. Click **Save Changes**. Render will automatically redeploy the backend.

---

## Step 5 — Test the Live App

Open your Vercel URL and verify:

- [ ] Register a new student account
- [ ] Register a new admin account  
- [ ] Log in as admin → create a company
- [ ] Log in as student → apply to the company
- [ ] Check that the dashboard loads data

---

## Redeploying After Code Changes

**Frontend (Vercel):** Vercel automatically redeploys when you push to `main` on GitHub. Nothing to do.

**Backend (Render):** Render also auto-deploys on every push to `main`. Nothing to do.

Just run:
```bash
git add .
git commit -m "your message"
git push origin main
```
Both services pick up the change within 2-3 minutes.

---

## ⚠️ Known Limitations

### Resume uploads don't persist on Render free tier
Render's free tier uses an **ephemeral filesystem** — uploaded resume files are deleted every time the backend redeploys or restarts (which happens automatically after 15 minutes of inactivity).

**What this means:** Resume upload/download/view features will not work reliably on the free tier.

**Fix (when needed):** Store resumes in [Cloudinary](https://cloudinary.com) or [AWS S3](https://aws.amazon.com/s3/) instead of local disk. This requires updating `backend/middleware/upload.js` and `backend/routes/resume.js`.

### Render free tier cold starts
The free backend service goes to sleep after 15 minutes of inactivity. The first request after sleep takes ~30-50 seconds. This is normal — subsequent requests are fast.

---

## Environment Variables Reference

### Backend (`backend/.env.example`)
```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/placement-tracker
JWT_SECRET=your_long_random_secret
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
EMAIL_SERVICE=gmail
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### Frontend (`frontend/.env.example`)
```
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

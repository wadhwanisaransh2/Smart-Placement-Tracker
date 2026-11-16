# Deployment Testing Checklist

## Pre-Deployment Checks

### Local Environment
- [ ] Backend `.env` has `FRONTEND_URL=http://localhost:3000`
- [ ] Backend connects to MongoDB Atlas (not localhost)
- [ ] Frontend builds successfully (`npm run build` in frontend folder)
- [ ] No console errors in browser when running locally

### Git Repository
- [ ] All changes committed
- [ ] All changes pushed to GitHub main branch
- [ ] Latest commit includes all fixes

---

## Deployment Configuration

### Vercel (Frontend)
Navigate to your Vercel project settings → Environment Variables

Required variables:
- [ ] `REACT_APP_API_URL` = `https://placement-tracker-backend-wdsm.onrender.com/api`

After setting/changing variables:
- [ ] Trigger a new deployment (Deployments tab → click "..." on latest → Redeploy)

### Render (Backend)
Navigate to your Render service → Environment tab

Required variables:
- [ ] `MONGODB_URI` = (your MongoDB Atlas connection string)
- [ ] `JWT_SECRET` = (a long random string)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`
- [ ] `FRONTEND_URL` = (your Vercel URL, e.g., `https://your-app.vercel.app`)
- [ ] `EMAIL_SERVICE` = `gmail`
- [ ] `EMAIL_USER` = (your Gmail)
- [ ] `EMAIL_PASS` = (your Gmail app password)

After setting/changing variables:
- [ ] Service will automatically redeploy

---

## Testing Deployed Application

### 1. Backend Health Check
- [ ] Open `https://placement-tracker-backend-wdsm.onrender.com/api/health`
- [ ] Should see: `{"status":"OK","message":"Placement Tracker API is running",...}`
- [ ] If error: Check Render logs for database connection issues

### 2. Frontend Loads
- [ ] Open your Vercel URL
- [ ] Login/Register page loads without errors
- [ ] No CORS errors in browser console (F12 → Console tab)
- [ ] If CORS error: Check `FRONTEND_URL` is set correctly on Render

### 3. Authentication (Login/Register)
- [ ] Click "Register" 
- [ ] Fill form with:
  - Name: Test Student
  - Email: teststudent@gmail.com
  - Password: test123456
  - Role: Student
  - Roll Number: 21CS001
  - Department: Computer Science
  - CGPA: 8.5
  - Graduation Year: 2026
- [ ] Registration succeeds → redirects to dashboard
- [ ] Logout
- [ ] Login with same credentials
- [ ] Login succeeds → redirects to dashboard

**If "no router available" error:**
- Check browser Network tab (F12) → see which URL it's calling
- Verify `REACT_APP_API_URL` is set in Vercel
- Redeploy frontend after setting env var

### 4. Student Features

#### Dashboard
- [ ] Dashboard loads
- [ ] "Available Companies" section shows companies
- [ ] "My Applications" section shows applied companies
- [ ] Stats cards show correct numbers

#### Companies Page
- [ ] All companies list loads
- [ ] Can search/filter companies
- [ ] Click on a company → details page opens
- [ ] Can apply to a company
- [ ] Application appears in "My Applications"

#### My Applications Page
- [ ] Lists all applied companies
- [ ] Status badges show correctly (Applied, Shortlisted, Selected, Rejected)
- [ ] Can filter by status

#### Profile Page
- [ ] Can upload resume (PDF only, max 5MB)
- [ ] Resume upload succeeds
- [ ] Can view uploaded resume (opens in new tab)
- [ ] Can download resume
- [ ] Can delete resume
- [ ] Can edit profile (phone, skills, etc.)

**Note:** On Render free tier, if the backend restarts, resume uploads stored on disk are lost. The app now stores resumes in MongoDB to avoid this.

### 5. Admin Features

Register/login as admin with a different email.

#### Dashboard
- [ ] Shows admin dashboard with overview stats
- [ ] Total students count
- [ ] Placed/unplaced stats
- [ ] Recent companies list

#### Companies Page (Admin)
- [ ] Click "Add Company" button
- [ ] Fill form and create company
- [ ] Company appears in list immediately
- [ ] Company shows correct stats:
  - Total applications count
  - Selected students count
  - Pending applications count
- [ ] Can edit company details
- [ ] Can delete company

**Test company stats update:**
1. [ ] Create a company as admin
2. [ ] Login as student
3. [ ] Apply to that company
4. [ ] Login as admin again
5. [ ] Companies page should show "1 application" for that company
6. [ ] Click on company → should see the student in applied list

#### Students Page (Admin)
- [ ] Lists all registered students
- [ ] Shows student details (name, roll number, CGPA, department)
- [ ] Shows placement status
- [ ] Click on a student → view detailed profile
- [ ] Can see student's applications
- [ ] Can download student's resume (if uploaded)

**Test resume download:**
1. [ ] Login as student → upload resume
2. [ ] Login as admin
3. [ ] Go to Students page
4. [ ] Click on the student who uploaded resume
5. [ ] Click "Download Resume" button
6. [ ] Resume should download successfully

#### Statistics Page (Admin)
- [ ] Overview cards show:
  - Total students
  - Placed students
  - Unplaced students
  - Placement percentage
- [ ] Department-wise statistics table shows all departments
- [ ] Package statistics show:
  - **Highest package** (from placed students)
  - **Lowest package** (from placed students)
  - **Average package** (from placed students)
- [ ] Top companies list shows companies with placement counts

**Test package statistics:**
1. [ ] Login as student
2. [ ] Update profile → make sure student is marked as placed
3. [ ] Set package (e.g., 12 LPA)
4. [ ] Login as admin
5. [ ] Go to Statistics page
6. [ ] Package stats should reflect the student's package

**Why packages might show 0:**
- No students marked as `isPlaced: true`
- Placed students don't have `package` field set
- To fix: Edit student profiles and set placement status + package amount

---

## Common Issues & Fixes

### Issue: "no router available"
**Cause:** Frontend can't reach backend
**Fix:** 
1. Check `REACT_APP_API_URL` in Vercel env vars
2. Make sure it ends with `/api` (e.g., `https://your-backend.onrender.com/api`)
3. Redeploy frontend after fixing

### Issue: CORS error in console
**Cause:** Backend doesn't allow requests from frontend URL
**Fix:**
1. Check `FRONTEND_URL` in Render env vars
2. Should match your Vercel URL exactly
3. Backend auto-redeploys after changing env vars

### Issue: Statistics show 0 packages
**Cause:** No students marked as placed with package amounts
**Fix:**
1. Login as student
2. Go to Profile
3. Make sure student data includes placement info
4. Or: Use MongoDB Compass/Atlas to directly update User documents:
   - Set `isPlaced: true`
   - Set `package: 1200000` (amount in rupees)
   - Set `placedCompany: "Company Name"`

### Issue: Companies page shows wrong stats
**Cause:** Application model not properly linked to companies
**Fix:** This should be fixed in the latest code. If still broken:
1. Check browser console for errors
2. Check Render logs for backend errors
3. Verify applications have correct `companyId` references

### Issue: Resume download fails (admin)
**Cause:** Resume not stored in database
**Fix:** 
1. Student must re-upload resume after latest deployment
2. New uploads are stored in MongoDB (not filesystem)
3. Old uploads on Render's disk are lost after restart

### Issue: Backend goes to sleep (slow first request)
**Cause:** Render free tier sleeps after 15 minutes of inactivity
**Fix:** This is normal. First request takes ~30-50 seconds. Keep-alive pings can help but may violate Render ToS.

---

## Performance Notes

1. **Cold starts:** First request after inactivity takes 30-50 seconds on Render free tier
2. **Resume storage:** Resumes now stored in MongoDB (Base64) — slower but persists across restarts
3. **Database queries:** Package statistics query scans all placed students — may be slow with 1000+ students

---

## After Testing

If all checks pass:
- [ ] Document any remaining issues in a GitHub Issue
- [ ] Share deployed URL with users
- [ ] Monitor Render logs for errors
- [ ] Check MongoDB Atlas for data integrity

If issues persist:
- [ ] Check Render logs: Dashboard → your service → Logs tab
- [ ] Check browser console: F12 → Console tab
- [ ] Check Network tab: F12 → Network → look for failed requests
- [ ] Share error messages for debugging

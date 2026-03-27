# Deployment Guide

## Architecture

- **Backend**: Render (Web Service) - `https://your-app.onrender.com`
- **Frontend**: Vercel - `https://your-app.vercel.app`
- **Database**: MongoDB Atlas (already configured)

---

## Step 1: Push Code to GitHub

Make sure your code is pushed to a GitHub repository.

```bash
git add .
git commit -m "prepare for deployment"
git push origin main
```

---

## Step 2: Deploy Backend on Render

### 2a. Create a New Web Service

1. Go to [render.com](https://render.com) and sign in (use GitHub login)
2. Click **New +** > **Web Service**
3. Connect your GitHub repo
4. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `portfolio-api` (or your choice) |
| **Region** | Oregon (US West) |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

### 2b. Set Environment Variables

In Render dashboard > your service > **Environment**, add these variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render uses this by default) |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A secure random string (min 32 chars) |
| `GROQ_API_KEY` | Your Groq API key |
| `CLOUDINARY_URL` | Your Cloudinary URL |
| `FRONTEND_URL` | Your Vercel URL (e.g., `https://your-app.vercel.app`) |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_PASS` | Your Gmail app password |
| `EMAIL_FROM` | `noreply@portfolio.com` |
| `ADMIN_EMAIL` | Your admin email |
| `ADMIN_PASSWORD` | Your admin password |

> **Important**: After deploying the frontend on Vercel, come back and update `FRONTEND_URL` with the actual Vercel URL.

### 2c. MongoDB Atlas: Whitelist Render IPs

1. Go to MongoDB Atlas > Network Access
2. Add **0.0.0.0/0** (allow from anywhere) or add Render's static outbound IPs
3. This is required for Render's free tier (dynamic IPs)

### 2d. Verify Backend

After deploy completes, visit:
- `https://your-app.onrender.com/health` - should return `{"status":"ok"}`
- `https://your-app.onrender.com/health/db` - should confirm MongoDB connection

> **Note**: Render free tier spins down after 15 min of inactivity. First request after sleep takes ~30-60 seconds.

---

## Step 3: Deploy Frontend on Vercel

### 3a. Import Project

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub login)
2. Click **Add New** > **Project**
3. Import your GitHub repo
4. Configure:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3b. Set Environment Variable

Add this environment variable in Vercel:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL (e.g., `https://portfolio-api-xxxx.onrender.com`) |

> **Important**: Vite env vars **must** start with `VITE_` to be exposed to the client.

### 3c. Deploy

Click **Deploy**. Vercel will build and deploy automatically.

### 3d. Verify Frontend

Visit your Vercel URL. The portfolio should load and connect to the Render backend.

---

## Step 4: Connect the Dots

After both are deployed:

1. **Update Render's `FRONTEND_URL`** with your actual Vercel URL (e.g., `https://your-app.vercel.app`)
   - Render dashboard > Environment > Edit `FRONTEND_URL`
   - Redeploy the service (Manual Deploy or it auto-deploys)

2. **Verify CORS**: Try logging in at `https://your-app.vercel.app/admin/login`
   - If cookies don't work, double-check `FRONTEND_URL` matches exactly (no trailing slash)

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` on Render matches your Vercel URL exactly (no trailing `/`)
- Check browser console for the specific CORS error

### Cookies Not Working (Can't Stay Logged In)
- `FRONTEND_URL` must be set correctly on Render
- `NODE_ENV` must be `production` on Render (enables `secure` + `sameSite=none` cookies)

### Backend Returns 503 / Timeout
- Render free tier sleeps after 15 min. Wait for cold start (~30-60s)
- Check Render logs for startup errors

### MongoDB Connection Failed
- Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access
- Verify `MONGODB_URI` is correct in Render env vars

### Chatbot / Resume Generation Not Working
- Verify `GROQ_API_KEY` is set in Render env vars

### Image Uploads Failing
- Verify `CLOUDINARY_URL` is set in Render env vars
- Render's filesystem is ephemeral, so local uploads won't persist (Cloudinary is required in production)

---

## Custom Domain (Optional)

### Vercel (Frontend)
1. Vercel dashboard > your project > Settings > Domains
2. Add your custom domain and configure DNS

### Render (Backend)
1. Render dashboard > your service > Settings > Custom Domains
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Update `VITE_API_URL` on Vercel to point to the new API domain
4. Update `FRONTEND_URL` on Render to your custom frontend domain

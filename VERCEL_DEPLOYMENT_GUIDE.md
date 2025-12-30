# Vercel Deployment Guide

## Current Status

✅ **Build Fixed** - Local build is working successfully
✅ **Import Paths Fixed** - Changed from relative imports to `@/` path alias
✅ **Code Pushed** - Latest changes are on GitHub

## Quick Fix for 404 NOT_FOUND Error

The 404 error you're seeing is likely because Vercel needs to be configured to look in the `frontend` directory for your Next.js app.

### Step 1: Configure Root Directory in Vercel

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project (class-memory-rooms)
3. Go to **Settings** → **General**
4. Scroll down to **Root Directory**
5. Click **Edit**
6. Enter: `frontend`
7. Click **Save**

### Step 2: Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

```
FORUMMS_API_URL=https://foru.ms/api/v1
FORUMMS_API_KEY=88e3494b-c191-429f-924a-b6440a9619cb

NEXTAUTH_SECRET=class-memory-rooms-secret-key-for-nextauth-minimum-32-chars
NEXTAUTH_URL=https://your-vercel-url.vercel.app

GEMINI_API_KEY=AIzaSyAj-ZzDtARnMiOJL-1PC9_PbUM5Z0ioXQI
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=4000
GEMINI_TEMPERATURE=0.7

AI_MIN_CONTRIBUTIONS=5
AI_STUDENT_COOLDOWN_HOURS=2
AI_TEACHER_COOLDOWN_HOURS=1

NODE_ENV=production
```

**IMPORTANT:** 
- Replace `https://your-vercel-url.vercel.app` with your actual Vercel URL
- You can find your Vercel URL in the **Domains** section of your project
- Select **Production**, **Preview**, and **Development** for each variable

### Step 3: Redeploy

After configuring the root directory and environment variables:

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait for the build to complete

## Understanding the 404 Error

### What Happened:

1. **Root Cause**: Vercel was looking for your Next.js app in the repository root, but it's actually in the `frontend` subdirectory
2. **Why It Failed**: Without the Root Directory setting, Vercel couldn't find `package.json` or the Next.js app
3. **The Fix**: Setting Root Directory to `frontend` tells Vercel where to find your app

### Why This Error Exists:

The 404 error protects you from:
- Accessing non-existent deployments
- Routing to incorrect paths
- Misconfigured projects

### Mental Model:

Think of Vercel deployments like this:
```
Repository Root (/)
  ├── package.json (workspace root)
  └── frontend/
      ├── package.json (Next.js app) ← Vercel needs to start here
      ├── app/
      ├── lib/
      └── ...
```

Without setting Root Directory, Vercel starts at `/` and can't find the Next.js app.

## Warning Signs to Watch For:

🚨 **Multiple package.json files** - Always set Root Directory when your app is in a subdirectory
🚨 **"Module not found" errors** - Often caused by incorrect root directory or import paths
🚨 **Build succeeds locally but fails on Vercel** - Usually environment or configuration differences

## Alternative Approaches:

### Option 1: Root Directory Setting (Recommended) ✅
- **Pros**: Clean, simple, follows Vercel best practices
- **Cons**: Requires manual configuration in dashboard
- **Use when**: Your app is in a subdirectory

### Option 2: Monorepo with vercel.json
- **Pros**: Configuration in code
- **Cons**: More complex, can cause routing issues
- **Use when**: You have multiple apps to deploy

### Option 3: Move Next.js to Root
- **Pros**: No configuration needed
- **Cons**: Restructures your repository
- **Use when**: Starting a new project

## Troubleshooting Checklist

- [ ] Root Directory set to `frontend` in Vercel settings
- [ ] All environment variables added
- [ ] `NEXTAUTH_URL` matches your actual Vercel URL
- [ ] Latest code pushed to GitHub
- [ ] Deployment triggered after configuration changes
- [ ] Build logs show no errors

## After Successful Deployment

1. ✅ Test authentication flow
2. ✅ Verify Foru.ms API connectivity
3. ✅ Test AI note generation
4. ✅ Check all routes are accessible
5. ✅ Update `NEXTAUTH_URL` if using a custom domain

## Security Note

⚠️ **IMPORTANT:** Your API keys are in `.env.local` which is properly excluded by `.gitignore`. Never commit this file to your repository.

## Next Steps

Once deployed successfully:
1. Test the demo school functionality
2. Create a test school and verify all features
3. Monitor Vercel logs for any runtime errors
4. Set up custom domain (optional)

---

**Need Help?** Check Vercel deployment logs for specific error messages.

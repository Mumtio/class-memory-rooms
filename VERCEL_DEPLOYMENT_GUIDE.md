# Vercel Deployment Guide

## Quick Fix for Current Deployment Failure

Your deployment is failing because Vercel doesn't have access to your environment variables.

### Step 1: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project (class-memory-rooms)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
FORUMMS_API_URL=https://foru.ms/api/v1
FORUMMS_API_KEY=88e3494b-c191-429f-924a-b6440a9619cb

NEXTAUTH_SECRET=class-memory-rooms-secret-key-for-nextauth-minimum-32-chars
NEXTAUTH_URL=https://your-actual-vercel-url.vercel.app

GEMINI_API_KEY=AIzaSyAj-ZzDtARnMiOJL-1PC9_PbUM5Z0ioXQI
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=4000
GEMINI_TEMPERATURE=0.7

AI_MIN_CONTRIBUTIONS=5
AI_STUDENT_COOLDOWN_HOURS=2
AI_TEACHER_COOLDOWN_HOURS=1

NODE_ENV=production
```

**IMPORTANT:** Replace `https://your-actual-vercel-url.vercel.app` with your actual Vercel deployment URL.

5. Make sure to select **Production**, **Preview**, and **Development** for each variable
6. Click **Save**

### Step 2: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click the three dots (...) on the failed deployment
3. Click **Redeploy**

OR simply push a new commit to trigger a new deployment.

### Step 3: Verify Build

The build should now succeed. If it still fails, check the build logs for specific errors.

## Security Note

⚠️ **IMPORTANT:** Your API keys are currently exposed in `.env.local`. Make sure this file is in `.gitignore` and never commit it to your repository.

Check your `.gitignore` includes:
```
.env.local
.env*.local
```

## Troubleshooting

If the deployment still fails after adding environment variables:

1. **Check the build logs** - Look for specific error messages
2. **Verify all environment variables are set** - Double-check spelling and values
3. **Check NEXTAUTH_URL** - Must match your production URL exactly
4. **Try a clean deployment** - Delete the project and redeploy from scratch

## Next Steps After Successful Deployment

1. Test authentication flow on production
2. Verify Foru.ms API connectivity
3. Test AI note generation with Gemini API
4. Monitor error logs in Vercel dashboard

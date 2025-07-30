# 🚀 Quick Vercel Deployment Checklist

## Before Deploying

- [x] Database connection working locally
- [x] All errors fixed
- [x] Environment variables documented
- [x] `vercel.json` configured
- [x] `.env` in `.gitignore`
- [ ] Code committed to Git

## Deploy to Vercel

### Option A: Quick Deploy (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. When prompted for environment variables, add:
#    - VITE_SUPABASE_URL
#    - VITE_SUPABASE_ANON_KEY
#    - VITE_DATABASE_SCHEMA
```

### Option B: GitHub Integration
1. Push to GitHub
2. Import in Vercel Dashboard
3. Add environment variables
4. Deploy

## Environment Variables to Add in Vercel

Copy these exactly:

```
VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE
VITE_DATABASE_SCHEMA=kastle_banking
```

## After Deployment

- [ ] Test the live URL
- [ ] Check dashboard loads
- [ ] Verify database connection
- [ ] No console errors

## Deployment URLs

- Preview: `https://[project-name]-[hash].vercel.app`
- Production: `https://[project-name].vercel.app`

Ready to deploy! 🎉
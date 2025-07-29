# Vercel Deployment Guide for Osol Dashboard

## Pre-Deployment Checklist

### 1. Environment Variables
You need to add these environment variables in Vercel:

```bash
VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE
VITE_DATABASE_SCHEMA=kastle_banking
```

### 2. Build Configuration
✅ Already configured in `vercel.json`:
- Build Command: `pnpm run build`
- Output Directory: `dist`
- Install Command: `pnpm install`
- Framework: Vite

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project? `N` (for first deployment)
   - Project name: `osol-dashboard` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings? `N`

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (see below)
   - Click "Deploy"

## Setting Environment Variables in Vercel

### Via Dashboard:
1. Go to your project in Vercel Dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in the left sidebar
4. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://bzlenegoilnswsbanxgb.supabase.co`
   - Environment: ✓ Production, ✓ Preview, ✓ Development
   
5. Repeat for all variables listed above

### Via CLI:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_DATABASE_SCHEMA
```

## Post-Deployment Setup

### 1. Initialize Database (if needed)
Since your database is already initialized locally, no additional setup is needed. The production app will connect to the same Supabase instance.

### 2. Custom Domain (Optional)
1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 3. Enable Analytics (Optional)
1. In Vercel Dashboard → Analytics
2. Enable Web Analytics
3. No code changes needed

## Important Notes

### Security Considerations:
- ✅ The anon key is safe to expose in frontend code (it's designed for public use)
- ✅ Row Level Security (RLS) should be enabled in Supabase for production
- ✅ Never expose service_role key in frontend code

### Performance:
- ✅ Static assets are cached (configured in vercel.json)
- ✅ SPA routing is handled (configured in vercel.json)
- ✅ Build optimizations are enabled via Vite

### Monitoring:
- Check Vercel Dashboard for:
  - Build logs
  - Function logs
  - Error tracking
  - Performance metrics

## Troubleshooting

### Build Failures:
1. Check build logs in Vercel Dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility

### Runtime Errors:
1. Check browser console
2. Verify environment variables are set
3. Check Vercel function logs

### Database Connection Issues:
1. Verify Supabase URL and anon key
2. Check Supabase dashboard for any issues
3. Ensure RLS policies allow access

## Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Promote to production
vercel --prod

# Rollback
vercel rollback

# Remove deployment
vercel remove [deployment-url]
```

## Build Optimization Tips

1. **Already Implemented**:
   - Code splitting via Vite
   - Tree shaking
   - Asset optimization
   - Compression

2. **Additional Optimizations** (if needed):
   - Enable Vercel Edge Functions for API routes
   - Use Vercel Image Optimization
   - Enable Incremental Static Regeneration (ISR) if adding SSG

## Success Checklist

After deployment, verify:
- [ ] Site loads at your Vercel URL
- [ ] Dashboard displays without errors
- [ ] Database connection works
- [ ] All features function correctly
- [ ] Performance is acceptable
- [ ] No console errors

Your app is ready for Vercel deployment! 🚀
# Vercel Deployment Guide for Osol Dashboard

## Prerequisites

1. A Vercel account
2. Vercel CLI installed (optional): `npm i -g vercel`
3. Environment variables configured in Vercel

## Environment Variables

You need to set the following environment variables in your Vercel project settings:

```
VITE_SUPABASE_URL=your_actual_supabase_url
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://api.osoulmodern.com
VITE_ENABLE_MOCK_DATA=false
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Vite
   - Build Command: `pnpm install && pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`
6. Add environment variables in the "Environment Variables" section
7. Click "Deploy"

### Option 2: Deploy via CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Run in your project directory:
   ```bash
   vercel
   ```
3. Follow the prompts to link your project
4. Set environment variables:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_APP_VERSION
   vercel env add VITE_API_BASE_URL
   vercel env add VITE_ENABLE_MOCK_DATA
   ```
5. Deploy:
   ```bash
   vercel --prod
   ```

## vercel.json Configuration

The `vercel.json` file has been configured with:

```json
{
  "buildCommand": "pnpm install && pnpm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configuration:
- Uses pnpm to install dependencies and build the project
- Outputs the built files to the `dist` directory
- Rewrites all routes to `index.html` for client-side routing

## Troubleshooting

### Build Fails
- Make sure all dependencies are listed in `package.json`
- Check that `pnpm-lock.yaml` is committed
- Verify environment variables are set correctly

### 404 Errors on Routes
- The rewrite rule in `vercel.json` should handle this
- Ensure the `dist` folder contains `index.html` after build

### Environment Variables Not Working
- Vercel requires a rebuild after adding environment variables
- Variables must start with `VITE_` to be exposed to the client
- Check the "Environment Variables" tab in your Vercel project settings

### Package Manager Issues
- The project uses pnpm as specified in `package.json`
- Vercel should automatically detect and use pnpm
- If issues persist, try clearing the build cache in Vercel settings

## Production Considerations

1. **Security**: Never expose sensitive keys in client-side code
2. **Performance**: Enable caching headers for static assets
3. **Monitoring**: Set up Vercel Analytics for performance monitoring
4. **Domains**: Configure custom domains in Vercel project settings
5. **SSL**: Vercel provides automatic SSL certificates

## Useful Commands

- Preview deployment: `vercel`
- Production deployment: `vercel --prod`
- View logs: `vercel logs`
- List environment variables: `vercel env ls`
- Pull environment variables: `vercel env pull`
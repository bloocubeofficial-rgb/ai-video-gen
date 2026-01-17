# Iframe Embedding Fix

## Problem
The AI Video Generator site was blocking iframe embedding from bloocube.com in production, even though it worked on localhost.

## Root Cause
Next.js sets `X-Frame-Options: DENY` by default, which blocks all iframe embedding. This header was preventing the Bloocube frontend from embedding the AI Video Generator in an iframe.

## Solution
Updated `next.config.mjs` to:
1. Remove the restrictive `X-Frame-Options` header
2. Use `Content-Security-Policy` with `frame-ancestors` to explicitly allow embedding from:
   - `https://bloocube.com`
   - `https://*.bloocube.com` (any subdomain)
   - `http://localhost:3000` and `http://localhost:*` (for development)

## Files Changed
- `ai-video-gen-main/next.config.mjs` - Added headers configuration to remove X-Frame-Options
- `ai-video-gen-main/middleware.ts` - Created middleware to explicitly remove X-Frame-Options and set CSP (most reliable method)

## Deployment Steps

1. **Rebuild the AI Video Generator:**
   ```bash
   cd ai-video-gen-main
   npm run build
   ```

2. **Redeploy to Cloud Run:**
   ```bash
   # Build and deploy
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/ai-video-gen
   
   gcloud run deploy ai-video-gen \
     --image gcr.io/[PROJECT-ID]/ai-video-gen \
     --region [YOUR-REGION] \
     --platform managed \
     --allow-unauthenticated
   ```

3. **Verify headers:**
   After deployment, check the headers:
   ```bash
   curl -I https://ai-video.bloocube.com
   ```
   
   You should see:
   - No `X-Frame-Options: DENY` header
   - `Content-Security-Policy: frame-ancestors 'self' https://bloocube.com ...` header

## Testing

1. After redeployment, test the iframe embedding:
   - Go to bloocube.com
   - Navigate to Creator or Brand dashboard
   - Click "AI Video" in the sidebar
   - The modal should now load the AI Video Generator successfully

2. Check browser console for any errors

## Alternative: Cloud Run Headers

If you're using Cloud Run with a load balancer or CDN, you might also need to configure headers there. However, the Next.js headers configuration should be sufficient for most cases.


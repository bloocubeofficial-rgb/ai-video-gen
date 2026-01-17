# Iframe Embedding Configuration

## Overview
This AI Video Generation app is configured to be embeddable in iframes from allowed origins. This is essential for integration with the Bloocube platform.

## Configuration

### Development Mode (Local)
By default, when `ALLOWED_IFRAME_ORIGINS` is not set, the app allows embedding from all origins (`*`). This is convenient for local development but **should not be used in production**.

### Production Mode (Recommended)
Set the `ALLOWED_IFRAME_ORIGINS` environment variable to restrict embedding to specific domains:

```bash
ALLOWED_IFRAME_ORIGINS=https://your-bloocube-frontend.com,https://staging.your-bloocube-frontend.com
```

**Important:** Use comma-separated URLs without spaces, or with spaces that will be trimmed automatically.

## Headers Configuration

The app sets the following headers in `next.config.mjs`:

1. **X-Frame-Options**: 
   - Set to `ALLOWALL` when allowing all origins
   - Set to `SAMEORIGIN` when restricting origins
   - This header controls iframe embedding at the HTTP level

2. **Content-Security-Policy (frame-ancestors)**:
   - Allows specific origins to embed the app in iframes
   - More granular control than X-Frame-Options
   - Supports multiple origins

## Deployment Instructions

### For Google Cloud Run

1. **Set environment variable during deployment:**
   ```bash
   gcloud run deploy ai-video-gen \
     --image gcr.io/[PROJECT-ID]/ai-video-gen \
     --region us-central1 \
     --set-env-vars ALLOWED_IFRAME_ORIGINS=https://your-bloocube-frontend.com
   ```

2. **Or update existing service:**
   ```bash
   gcloud run services update ai-video-gen \
     --region us-central1 \
     --update-env-vars ALLOWED_IFRAME_ORIGINS=https://your-bloocube-frontend.com
   ```

### For Other Platforms

Set the `ALLOWED_IFRAME_ORIGINS` environment variable in your deployment platform's configuration:

- **Vercel**: Add to project settings > Environment Variables
- **Docker**: Pass via `-e` flag or docker-compose.yml
- **Kubernetes**: Add to ConfigMap or Secret
- **AWS/GCP/Azure**: Use respective secrets/environment variable services

## Testing iframe Embedding

### Test Locally

1. **Without restrictions (allows all):**
   ```bash
   # Don't set ALLOWED_IFRAME_ORIGINS
   npm run dev
   ```

2. **With restrictions:**
   ```bash
   ALLOWED_IFRAME_ORIGINS=http://localhost:3000 npm run dev
   ```

3. **Create a test HTML file:**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Iframe Embed Test</title>
   </head>
   <body>
     <h1>Testing iframe Embedding</h1>
     <iframe 
       src="http://localhost:3000" 
       width="100%" 
       height="800px"
       style="border: 2px solid #ccc;">
     </iframe>
   </body>
   </html>
   ```

### Test in Production

1. Deploy with `ALLOWED_IFRAME_ORIGINS` set to your Bloocube frontend URL
2. In the Bloocube frontend, open the AI Studio modal
3. Verify the iframe loads without console errors
4. Check browser DevTools > Network > Headers to confirm headers are set correctly

## Troubleshooting

### Issue: Blank iframe or "Refused to display in a frame"

**Cause:** X-Frame-Options or CSP blocking the embedding

**Solution:**
1. Verify `ALLOWED_IFRAME_ORIGINS` includes your Bloocube frontend URL
2. Check that the URL matches exactly (including https/http, with/without trailing slash)
3. Ensure headers are being set correctly (check browser DevTools)
4. Rebuild and redeploy the application after changing `next.config.mjs`

### Issue: Works in development but not in production

**Cause:** Environment variable not set in production

**Solution:**
1. Verify `ALLOWED_IFRAME_ORIGINS` is set in your deployment platform
2. Check Cloud Run logs: `gcloud run logs read ai-video-gen --region us-central1`
3. Restart the service after setting the variable

### Issue: CORS errors in console

**Note:** CORS is different from iframe embedding. If you're getting CORS errors:
- Check API routes in the app
- Ensure API routes handle cross-origin requests if needed
- This is separate from iframe embedding configuration

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never use `ALLOWALL` or `*` in production** - This allows any website to embed your app
2. **Always specify exact domains** - Include protocol (https://) and exact domain names
3. **Use HTTPS in production** - Both the AI Studio and Bloocube frontend should use HTTPS
4. **Review allowed origins regularly** - Remove unused domains from the allowlist

## Integration with Bloocube

The Bloocube frontend is configured to:
- Open AI Studio in a full-screen modal
- Load the AI Studio URL in an iframe
- Handle loading states and errors gracefully

Make sure to:
1. Set `ALLOWED_IFRAME_ORIGINS` to your Bloocube frontend production URL
2. Update `NEXT_PUBLIC_AI_STUDIO_URL` in Bloocube frontend to point to your deployed AI Studio
3. Test the integration end-to-end

## Additional Resources

- [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [MDN: Content-Security-Policy frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
- [Next.js Headers Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/headers)


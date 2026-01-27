# Video URI Not Found Fix

## Problem
Users were experiencing intermittent errors: **"System Error: Video generation complete but URL not found"** after video generation completed successfully.

## Root Cause
The Google Generative AI API response structure for video generation can vary, and the code was only checking 3 specific paths for the video URI:
1. `pollData.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri`
2. `pollData.response?.generatedVideos?.[0]?.video?.uri`
3. `pollData.metadata?.outputUri`

When the API returned the URI in a different location, the code would fail even though the video was successfully generated.

## Solution
Enhanced the video generation polling logic with:

### 1. **Expanded URI Path Checks**
Added 5 additional known paths to check:
- `pollData.response?.generateVideoResponse?.generatedSamples?.[0]?.uri`
- `pollData.response?.generatedVideos?.[0]?.uri`
- `pollData.response?.video?.uri`
- `pollData.outputUri`
- `pollData.uri`

### 2. **Recursive URI Search**
Created a `findVideoUri()` helper function that recursively searches the entire response object for any `uri` property, ensuring we can find the video URI even if the API response structure changes.

### 3. **Better Error Handling**
- Added HTTP error handling for polling requests
- Improved error messages with actual response data
- Added timeout detection (60 attempts = 3 minutes)

### 4. **Enhanced Logging**
- Logs the full response structure when URI is not found in known paths
- Logs progress every 10 polling attempts
- Logs success when URI is found
- Better error messages for debugging

## Files Changed
- `ai-video-gen-main/app/api/chat/route.ts` - Enhanced video generation polling logic (lines 237-331)

## Deployment Steps

1. **Rebuild the application:**
   ```bash
   cd ai-video-gen-main
   npm run build
   ```

2. **Test locally (optional):**
   ```bash
   npm run dev
   ```
   Test video generation to ensure the fix works.

3. **Deploy to Cloud Run:**
   ```bash
   # Build and push Docker image
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/ai-video-gen
   
   # Deploy to Cloud Run
   gcloud run deploy ai-video-gen \
     --image gcr.io/[PROJECT-ID]/ai-video-gen \
     --region [YOUR-REGION] \
     --platform managed \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --timeout 300
   ```

## Testing
After deployment:
1. Generate a video using the AI Video Generator
2. Check Cloud Run logs if issues occur - you'll now see detailed response structures
3. The recursive search should find the URI even if the API response structure changes

## Monitoring
Check Cloud Run logs for:
- `[Video Generation] Success! Video URI found:` - Confirms successful URI detection
- `[Video Generation] URI not found in known paths, searching entire response...` - Indicates API response structure may have changed
- `[Video Generation] Full response structure:` - Full response logged for debugging

## Benefits
- ✅ Handles varying API response structures
- ✅ Recursive search ensures URI is found even if structure changes
- ✅ Better error messages for debugging
- ✅ Comprehensive logging for troubleshooting
- ✅ More robust error handling


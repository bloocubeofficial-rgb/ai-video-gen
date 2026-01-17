# GCP Cloud Run Deployment Guide

This guide explains how to deploy the AI Video Generation app to Google Cloud Run.

## Prerequisites

1. Google Cloud SDK (gcloud) installed and configured
2. Docker installed locally (for testing)
3. A GCP project with billing enabled
4. Cloud Run API enabled in your GCP project

## Environment Variables

The application requires the following environment variable:
- `GOOGLE_API_KEY` or `GEMINI_API_KEY`: Your Google AI API key

## Building and Deploying

### Option 1: Deploy using gcloud CLI

1. **Build and push the Docker image to Google Container Registry:**
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/ai-video-gen
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy ai-video-gen \
     --image gcr.io/[PROJECT-ID]/ai-video-gen \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars GOOGLE_API_KEY=your-api-key-here \
     --memory 2Gi \
     --cpu 2 \
     --timeout 300 \
     --max-instances 10
   ```

### Option 2: Deploy using Cloud Build

1. **Create a `cloudbuild.yaml` file** (optional, for CI/CD):
   ```yaml
   steps:
     - name: 'gcr.io/cloud-builders/docker'
       args: ['build', '-t', 'gcr.io/$PROJECT_ID/ai-video-gen', '.']
     - name: 'gcr.io/cloud-builders/docker'
       args: ['push', 'gcr.io/$PROJECT_ID/ai-video-gen']
     - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
       entrypoint: gcloud
       args:
         - 'run'
         - 'deploy'
         - 'ai-video-gen'
         - '--image'
         - 'gcr.io/$PROJECT_ID/ai-video-gen'
         - '--region'
         - 'us-central1'
         - '--platform'
         - 'managed'
         - '--allow-unauthenticated'
   ```

2. **Submit the build:**
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

## Important Configuration Notes

- **Memory**: Set to 2Gi (recommended for AI operations)
- **CPU**: Set to 2 (for better performance with AI model calls)
- **Timeout**: Set to 300 seconds (5 minutes) to handle long-running video generation tasks
- **Max Instances**: Adjust based on your expected traffic
- **Port**: The app automatically uses the `PORT` environment variable set by Cloud Run (default: 8080)

## Testing Locally

Before deploying, you can test the Docker image locally:

```bash
# Build the image
docker build -t ai-video-gen .

# Run the container
docker run -p 8080:8080 -e GOOGLE_API_KEY=your-api-key-here ai-video-gen
```

Then visit `http://localhost:8080` in your browser.

## Updating the Deployment

To update your Cloud Run service:

```bash
gcloud run deploy ai-video-gen \
  --image gcr.io/[PROJECT-ID]/ai-video-gen \
  --region us-central1
```

## Monitoring

Monitor your Cloud Run service in the [Google Cloud Console](https://console.cloud.google.com/run).

## Troubleshooting

- **Check logs**: `gcloud run logs read ai-video-gen --region us-central1`
- **Verify environment variables**: Check in Cloud Console > Cloud Run > ai-video-gen > Variables & Secrets
- **Check resource limits**: Ensure memory and CPU are sufficient for your workload


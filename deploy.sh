#!/bin/bash

# Wayra Deployment Script
# This script deploys both frontend and backend to GCP Cloud Run

set -e

PROJECT_ID="wayra-22"
REGION="us-central1"

echo "🚀 Starting Wayra deployment to GCP..."
echo "📍 Project ID: $PROJECT_ID"
echo "🌍 Region: $REGION"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with gcloud first:"
    echo "   gcloud auth login"
    exit 1
fi

# Set the project
echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required GCP APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

echo ""
echo "🏗️  Building and deploying backend..."
echo "=================================="

# Deploy backend
cd wayra-backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/wayra-backend
gcloud run deploy wayra-backend \
    --image gcr.io/$PROJECT_ID/wayra-backend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production,GCP_PROJECT_ID=$PROJECT_ID

cd ..

echo ""
echo "🎨 Building and deploying frontend..."
echo "===================================="

# Deploy frontend
cd wayra-frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/wayra-frontend
gcloud run deploy wayra-frontend \
    --image gcr.io/$PROJECT_ID/wayra-frontend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 3000 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production

cd ..

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🔗 Your Wayra application URLs:"
echo "Frontend: $(gcloud run services describe wayra-frontend --region=$REGION --format='value(status.url)')"
echo "Backend:  $(gcloud run services describe wayra-backend --region=$REGION --format='value(status.url)')"
echo ""
echo "🧪 Test your deployment:"
echo "Frontend: Open the frontend URL in your browser"
echo "Backend:  curl \$(gcloud run services describe wayra-backend --region=$REGION --format='value(status.url)')/health"
echo ""
echo "🎉 Wayra is now live on Google Cloud Platform!"

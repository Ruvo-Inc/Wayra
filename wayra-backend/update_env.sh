#!/bin/bash

# Update .env file with actual API keys
cat > .env << 'EOF'
# Server Configuration
PORT=8080
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://wayra-admin:dy9h5zEIUhVs9738@wayra-cluster.1emhtva.mongodb.net/wayra?retryWrites=true&w=majority&appName=wayra-cluster
REDIS_URL=redis://default:MQdsh0Mu8tiVgNTQFsR3xmXk0i9SwtHt@redis-11331.c259.us-central1-2.gce.redns.redis-cloud.com:11331

# Travel API Configuration - ACTUAL KEYS
AMADEUS_CLIENT_ID=Gr2LcmzwiOnGbUb0jyRoP3L4N7S9hp4D
AMADEUS_CLIENT_SECRET=Mo1EG5BmG8MzUwkh
DUFFEL_API_TOKEN=your_duffel_api_token_here

# Skyscanner API (not configured yet)
SKYSCANNER_API_KEY=your_skyscanner_api_key

# Booking.com API (not configured yet)
BOOKING_USERNAME=your_booking_username
BOOKING_PASSWORD=your_booking_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Firebase Configuration
FIREBASE_PROJECT_ID=wayra-22
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Google Cloud Platform
GCP_PROJECT_ID=wayra-22
GCP_REGION=us-central1

# Google Maps API
GOOGLE_MAPS_API_KEY=AIzaSyAH8nlVZG1eT_gJ2vJ4LVHdUWXzsHGGXVw

# Stripe Configuration (not configured yet)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Email Configuration (not configured yet)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@wayra.com
EOF

echo "✅ Environment variables updated with actual API keys"
echo "🔄 Please restart the backend server to load new environment variables"

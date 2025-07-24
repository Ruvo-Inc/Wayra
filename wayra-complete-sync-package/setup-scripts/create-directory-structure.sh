#!/bin/bash

# Wayra Enhanced Production - Directory Structure Setup Script
# This script creates the complete world-class directory structure

echo "🏗️  Creating Wayra Enhanced Production Directory Structure..."

# Create main directories
mkdir -p {backend,frontend,shared,docs,tests,deployment,monitoring}

# Backend structure
echo "📁 Creating backend structure..."
cd backend
mkdir -p {src/{controllers,services,models,middleware,utils,config,types},tests/{unit,integration,e2e},docs,scripts,migrations}

# Backend services structure
cd src/services
mkdir -p {itinerary,monitoring,optimization,booking,notifications,ai,analytics,security,payments,external-apis}
cd ../../..

# Frontend structure
echo "📁 Creating frontend structure..."
cd frontend
mkdir -p {src/{components,pages,services,hooks,utils,types,contexts,assets},public,tests,docs}

# Frontend components structure
cd src/components
mkdir -p {itinerary,stacks,monitoring,ui,forms,charts,notifications,ai}
cd ../../../..

# Shared resources
echo "📁 Creating shared resources..."
mkdir -p shared/{types,constants,utils,schemas}

# Documentation
echo "📁 Creating documentation structure..."
mkdir -p docs/{api,architecture,deployment,user-guides}

# Testing
echo "📁 Creating testing structure..."
mkdir -p tests/{performance,security,accessibility}

# Deployment
echo "📁 Creating deployment structure..."
mkdir -p deployment/{docker,kubernetes,terraform}

# Monitoring
echo "📁 Creating monitoring structure..."
mkdir -p monitoring/{logs,metrics,alerts}

# Create initial package.json files
echo "📦 Creating initial package.json files..."

# Backend package.json
cat > backend/package.json << 'EOF'
{
  "name": "wayra-backend-enhanced",
  "version": "1.0.0",
  "description": "Wayra Enhanced Backend - World-Class Travel Platform",
  "main": "src/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "keywords": ["travel", "ai", "automation", "booking"],
  "author": "Wayra Team",
  "license": "PROPRIETARY"
}
EOF

# Frontend package.json template (will be overwritten by Vite)
cat > frontend/package.json << 'EOF'
{
  "name": "wayra-frontend-enhanced",
  "version": "1.0.0",
  "description": "Wayra Enhanced Frontend - World-Class Travel Platform",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix"
  },
  "keywords": ["travel", "ai", "react", "typescript"],
  "author": "Wayra Team",
  "license": "PROPRIETARY"
}
EOF

# Create TypeScript configuration files
echo "⚙️  Creating TypeScript configurations..."

# Backend tsconfig.json
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/controllers/*": ["./controllers/*"],
      "@/services/*": ["./services/*"],
      "@/models/*": ["./models/*"],
      "@/middleware/*": ["./middleware/*"],
      "@/utils/*": ["./utils/*"],
      "@/config/*": ["./config/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

# Create environment template files
echo "🔧 Creating environment templates..."
mkdir -p setup-scripts/env-templates

cat > setup-scripts/env-templates/.env.backend.template << 'EOF'
# Wayra Backend Environment Configuration
# Copy this file to backend/.env and fill in your actual values

# Application
NODE_ENV=development
PORT=5000
API_VERSION=v1

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/wayra_enhanced
REDIS_URL=redis://localhost:6379

# External APIs (for future automated booking)
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
BOOKING_API_KEY=your_booking_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key

# Monitoring
LOG_LEVEL=debug
ENABLE_METRICS=true
EOF

cat > setup-scripts/env-templates/.env.frontend.template << 'EOF'
# Wayra Frontend Environment Configuration
# Copy this file to frontend/.env.local and fill in your actual values

# API Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_API_VERSION=v1

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_AUTOMATED_BOOKING=true
VITE_ENABLE_ANALYTICS=true

# Development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
EOF

# Create README files for each major directory
echo "📝 Creating README files..."

cat > backend/README.md << 'EOF'
# Wayra Enhanced Backend

World-class backend implementation for Wayra's revolutionary travel platform.

## Features
- AI-powered travel planning agents
- Intelligent price monitoring and automated booking
- Comprehensive itinerary management
- Real-time notifications and updates
- Enterprise-grade security and scalability

## Getting Started
1. Install dependencies: `npm install`
2. Configure environment: Copy `.env.template` to `.env`
3. Start development server: `npm run dev`

## Architecture
- **Controllers**: API route handlers
- **Services**: Business logic and external integrations
- **Models**: Data models and database schemas
- **Middleware**: Authentication, validation, and security
- **Utils**: Shared utilities and helpers
EOF

cat > frontend/README.md << 'EOF'
# Wayra Enhanced Frontend

World-class React/TypeScript frontend for Wayra's revolutionary travel platform.

## Features
- Itinerary-centric navigation with stack-based architecture
- AI-powered travel planning interface
- Real-time monitoring dashboard
- Responsive design for all devices
- Comprehensive accessibility support

## Getting Started
1. Install dependencies: `npm install`
2. Configure environment: Copy `.env.local.template` to `.env.local`
3. Start development server: `npm run dev`

## Architecture
- **Components**: Reusable React components organized by feature
- **Pages**: Top-level page components
- **Services**: API client services
- **Hooks**: Custom React hooks
- **Utils**: Frontend utilities and helpers
EOF

echo "✅ Directory structure created successfully!"
echo ""
echo "📁 Created directories:"
find . -type d | wc -l | xargs echo "   Total directories:"
echo ""
echo "🎯 Next steps:"
echo "   1. Run: ./setup-scripts/migrate-existing-ai.sh"
echo "   2. Install dependencies in backend/ and frontend/"
echo "   3. Configure environment variables"
echo "   4. Start development servers"
echo ""
echo "🚀 Ready for world-class implementation!"


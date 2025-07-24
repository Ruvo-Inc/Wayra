#!/bin/bash

# Wayra Enhanced Production - Setup Verification Script
# Verifies that the complete setup was successful

echo "🔍 Verifying Wayra Enhanced Production Setup..."

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the wayra-enhanced-complete directory"
    exit 1
fi

# Initialize verification results
VERIFICATION_PASSED=true

echo ""
echo "📁 Checking directory structure..."

# Check backend directories
BACKEND_DIRS=(
    "backend/src/controllers"
    "backend/src/services/ai"
    "backend/src/services/itinerary"
    "backend/src/services/monitoring"
    "backend/src/models"
    "backend/src/middleware"
    "backend/src/config"
    "backend/tests"
)

for dir in "${BACKEND_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir"
    else
        echo "❌ $dir (missing)"
        VERIFICATION_PASSED=false
    fi
done

# Check frontend directories
FRONTEND_DIRS=(
    "frontend/src/components/ai"
    "frontend/src/components/itinerary"
    "frontend/src/components/stacks"
    "frontend/src/services"
    "frontend/src/pages"
    "frontend/tests"
)

for dir in "${FRONTEND_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir"
    else
        echo "❌ $dir (missing)"
        VERIFICATION_PASSED=false
    fi
done

echo ""
echo "📦 Checking package.json files..."

if [ -f "backend/package.json" ]; then
    echo "✅ backend/package.json"
else
    echo "❌ backend/package.json (missing)"
    VERIFICATION_PASSED=false
fi

if [ -f "frontend/package.json" ]; then
    echo "✅ frontend/package.json"
else
    echo "❌ frontend/package.json (missing)"
    VERIFICATION_PASSED=false
fi

echo ""
echo "⚙️  Checking configuration files..."

if [ -f "backend/tsconfig.json" ]; then
    echo "✅ backend/tsconfig.json"
else
    echo "❌ backend/tsconfig.json (missing)"
    VERIFICATION_PASSED=false
fi

if [ -f "backend/.env" ]; then
    echo "✅ backend/.env"
else
    echo "⚠️  backend/.env (not configured - copy from template)"
fi

if [ -f "frontend/.env.local" ]; then
    echo "✅ frontend/.env.local"
else
    echo "⚠️  frontend/.env.local (not configured - copy from template)"
fi

echo ""
echo "🤖 Checking AI components..."

AI_FILES=(
    "backend/src/services/ai/agents/AgentService.js"
    "backend/src/services/ai/OpenAIService.js"
    "backend/src/config/configLoader.js"
    "backend/src/routes/ai/agents.js"
    "frontend/src/components/ai/agents/MultiAgentPlanning.tsx"
    "frontend/src/services/ai/multiAgentApi.ts"
)

for file in "${AI_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        VERIFICATION_PASSED=false
    fi
done

echo ""
echo "🔧 Checking Node.js and npm..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
    
    # Check if Node.js version is 18 or higher
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -ge 18 ]; then
        echo "✅ Node.js version is compatible (18+)"
    else
        echo "⚠️  Node.js version should be 18 or higher for best compatibility"
    fi
else
    echo "❌ Node.js not found"
    VERIFICATION_PASSED=false
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found"
    VERIFICATION_PASSED=false
fi

echo ""
echo "📊 Dependency check..."

# Check backend dependencies
if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed (run: cd backend && npm install)"
fi

# Check frontend dependencies
if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed (run: cd frontend && npm install)"
fi

echo ""
echo "🌐 Environment variables check..."

if [ -f "backend/.env" ]; then
    if grep -q "OPENAI_API_KEY=" backend/.env && ! grep -q "your_openai_api_key" backend/.env; then
        echo "✅ OpenAI API key configured"
    else
        echo "⚠️  OpenAI API key needs to be configured in backend/.env"
    fi
    
    if grep -q "FIREBASE_PROJECT_ID=" backend/.env && ! grep -q "your_firebase_project_id" backend/.env; then
        echo "✅ Firebase project ID configured"
    else
        echo "⚠️  Firebase project ID needs to be configured in backend/.env"
    fi
else
    echo "⚠️  Backend environment file not found"
fi

echo ""
echo "📋 Setup Summary:"
echo "=================="

if [ "$VERIFICATION_PASSED" = true ]; then
    echo "🎉 Setup verification PASSED!"
    echo ""
    echo "✅ All required directories and files are present"
    echo "✅ Configuration files are in place"
    echo "✅ AI components are properly migrated"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Configure environment variables in backend/.env and frontend/.env.local"
    echo "   2. Install dependencies: cd backend && npm install && cd ../frontend && npm install"
    echo "   3. Start development servers:"
    echo "      - Backend: cd backend && npm run dev"
    echo "      - Frontend: cd frontend && npm run dev"
    echo ""
    echo "🎯 Ready for world-class development!"
else
    echo "❌ Setup verification FAILED!"
    echo ""
    echo "Please address the missing components above before proceeding."
    echo ""
    echo "🔧 Common fixes:"
    echo "   - Run: ./setup-scripts/create-directory-structure.sh"
    echo "   - Run: ./setup-scripts/migrate-existing-ai.sh"
    echo "   - Install Node.js 18+ if not present"
    echo "   - Copy environment templates and configure"
fi

echo ""
echo "📞 Need help? Check the COMPLETE_SETUP_GUIDE.md for detailed instructions."

exit $([ "$VERIFICATION_PASSED" = true ] && echo 0 || echo 1)


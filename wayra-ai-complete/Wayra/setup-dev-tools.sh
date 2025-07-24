#!/bin/bash

# Wayra Local Development Environment Setup Script
# This script helps set up the remaining development tools

set -e

echo "🛠️  Wayra Local Development Environment Setup"
echo "=============================================="
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

echo "✅ Homebrew is installed"

# Install MongoDB Compass
echo ""
echo "📦 Installing MongoDB Compass..."
if brew list --cask mongodb-compass &> /dev/null; then
    echo "✅ MongoDB Compass is already installed"
else
    echo "Installing MongoDB Compass via Homebrew..."
    brew install --cask mongodb-compass
    echo "✅ MongoDB Compass installed successfully"
fi

# Check current tool status
echo ""
echo "🔍 Current Development Environment Status:"
echo "=========================================="

# Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: Not installed"
fi

# Git
if command -v git &> /dev/null; then
    echo "✅ Git: $(git --version)"
else
    echo "❌ Git: Not installed"
fi

# Google Cloud SDK
if command -v gcloud &> /dev/null; then
    echo "✅ Google Cloud SDK: $(gcloud --version | head -1)"
    echo "   Active Project: $(gcloud config get-value project 2>/dev/null || echo 'Not set')"
    echo "   Active Account: $(gcloud config get-value account 2>/dev/null || echo 'Not authenticated')"
else
    echo "❌ Google Cloud SDK: Not installed"
fi

# MongoDB Compass
if brew list --cask mongodb-compass &> /dev/null; then
    echo "✅ MongoDB Compass: Installed"
else
    echo "❌ MongoDB Compass: Not installed"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. ✅ MongoDB Compass - Install completed"
echo "2. ⚠️  MongoDB Atlas - Manual setup required:"
echo "   → Go to: https://www.mongodb.com/cloud/atlas"
echo "   → Create free account and cluster"
echo "   → Get connection string for .env file"
echo ""
echo "3. ⚠️  Redis Cloud - Manual setup required:"
echo "   → Go to: https://redis.com/try-free/"
echo "   → Create free account and database"
echo "   → Get connection string for .env file"
echo ""
echo "4. 🔧 Update .env file with database connection strings"
echo ""
echo "🎉 Local development environment setup is nearly complete!"
echo "   After setting up MongoDB Atlas and Redis Cloud, you'll be ready to deploy!"

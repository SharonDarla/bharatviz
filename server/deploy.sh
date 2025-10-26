#!/bin/bash

# BharatViz API Server Deployment Script
# This script is called by GitHub Actions to deploy the API server

set -e  # Exit on error

echo "🚀 Starting BharatViz API deployment..."

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

# Stop existing PM2 process if running
if pm2 list | grep -q "bharatviz-api"; then
    echo "⏸️  Stopping existing process..."
    pm2 stop bharatviz-api
fi

# Start/restart the application with PM2
echo "▶️  Starting application with PM2..."
pm2 start dist/index.js \
    --name bharatviz-api \
    --time \
    --instances 2 \
    --exec-mode cluster \
    --max-memory-restart 500M \
    --env production

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"

# Show status
pm2 status bharatviz-api

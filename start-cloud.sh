#!/bin/bash

# CloudDesk Professional - One-Click Deployment
# Author: João Ricardo
# Objective: Map disks, build project and run in background.

echo "🌟 Starting CloudDesk Professional..."

# 1. Setup Storage
echo "📂 Configuring Storage Pool..."
chmod +x setup-production.sh
sudo ./setup-production.sh

# 2. Build Projects
echo "🏗️ Building Backend..."
cd backend && npm run build && cd ..

echo "🏗️ Building Frontend (Optimized)..."
cd web && npm run build && cd ..

# 3. Start Service with PM2
echo "🚀 Launching background services..."
pm2 delete clouddesk-backend clouddesk-frontend 2>/dev/null
pm2 start ecosystem.config.js
pm2 save

echo "🎉 CLOUD READY!"
echo "📍 Access at: http://localhost:3000"
echo "📊 Monitor with: pm2 status"
echo "📜 Logs: pm2 logs"

#!/bin/bash

# ⚡ Nexus One-Click: Autonomous Deployment Engine
# Purpose: Zero-manual-intervention stack deployment and verification.

set -e

echo "⚡ INITIATING NEXUS ONE-CLICK DEPLOYMENT..."

# 1. Integrity Check
if [ ! -f ./server/.env ]; then
    echo "❌ ERROR: .env file missing in ./server/"
    echo "💡 Run 'cp ./server/.env.example ./server/.env' and add your secrets first."
    exit 1
fi

# 2. Forensic Backup (If existing data exists)
if [ "$(docker ps -q -f name=nexus-db)" ]; then
    echo "📦 Existing cluster detected. Taking safety backup..."
    ./nexus-deploy.sh backup
fi

# 3. Stack Orchestration
echo "🏗️ Building and Orchestrating Nexus Stack..."
docker compose pull || true
docker compose up -d --build

# 4. Vitality Handshake
echo "📡 Awaiting System Handshake (30s)..."
sleep 30

# 5. Production Validation
echo "🔍 Validating Deployment Health..."
if ./verify_deployment.sh; then
    echo -e "\n✅ DEPLOYMENT SUCCESSFUL!"
    echo "🌐 Platform Live at: http://$(curl -s ifconfig.me)"
    echo "🛡️ Admin Console: http://$(curl -s ifconfig.me)/nexus-admin"
else
    echo -e "\n❌ DEPLOYMENT FAILED: Handshake timeout or healthcheck error."
    echo "💡 Run 'docker compose logs nexus-server' for forensics."
    exit 1
fi

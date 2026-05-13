#!/bin/bash

# ─── Nexus Deployment & Maintenance Engine ───────────────────────────────────
# Version: 1.0.0

set -e

# Configuration
PROJECT_NAME="cybershield-x"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Check for .env file
if [ ! -f ./server/.env ]; then
    echo "❌ ERROR: ./server/.env file missing. Deployment aborted."
    exit 1
fi

case "$1" in
    up)
        echo "🚀 Deploying Nexus Core..."
        docker compose up -d --build
        echo "✅ Deployment successful. SOC is active."
        ;;
    down)
        echo "🛑 Shutting down Nexus Core..."
        docker compose down
        ;;
    update)
        echo "🔄 Performing Zero-Downtime Update..."
        # Pull latest changes (if git is used)
        # git pull origin main
        
        # Build and update services sequentially
        docker compose build nexus-server
        docker compose up -d nexus-server
        
        docker compose build nexus-frontend
        docker compose up -d nexus-frontend
        
        echo "✅ Update complete. Services rotated."
        ;;
    backup)
        echo "🗄️ Initializing Forensic Backup..."
        mkdir -p $BACKUP_DIR
        docker exec nexus-db mongodump --archive --gzip --db cybershield > "$BACKUP_DIR/nexus_backup_$TIMESTAMP.gz"
        echo "✅ Backup saved to: $BACKUP_DIR/nexus_backup_$TIMESTAMP.gz"
        ;;
    logs)
        docker compose logs -f --tail 100
        ;;
    health)
        echo "🩺 Nexus System Health Check:"
        docker compose ps
        ;;
    *)
        echo "Usage: $0 {up|down|update|backup|logs|health}"
        exit 1
        ;;
esac

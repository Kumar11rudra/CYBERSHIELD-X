#!/bin/bash

# 🛡️ Nexus Deployment Verification Script (v1.0)
# Purpose: Perform a clean-room verification of the production stack.

set -e

echo "🚀 STARTING DEPLOYMENT VERIFICATION..."

# 1. Environment Audit
echo "Step 1: Auditing Environment Secrets..."
if [ ! -f ./server/.env ]; then
  echo "❌ CRITICAL: .env file missing! Use .env.example to create one."
  exit 1
fi
echo "✅ Environment secrets detected."

# 2. Dependency Audit
echo "Step 2: Checking Container Architecture..."
if ! command -v docker &> /dev/null; then
  echo "❌ ERROR: Docker is not installed on this host."
  exit 1
fi
echo "✅ Docker Runtime detected."

# 3. Stack Cold-Start
echo "Step 3: Initiating Production Stack (Cold-Start Simulation)..."
docker compose up -d --build
echo "Stack is booting. Waiting for Healthchecks (30s grace period)..."
sleep 30

# 4. Vitality Verification
echo "Step 4: Verifying Service Vitality..."
DB_HEALTH=$(docker inspect -f '{{.State.Health.Status}}' nexus-db)
SERVER_HEALTH=$(docker inspect -f '{{.State.Health.Status}}' nexus-server)

echo "Nexus-DB: $DB_HEALTH"
echo "Nexus-Server: $SERVER_HEALTH"

if [ "$DB_HEALTH" == "healthy" ] && [ "$SERVER_HEALTH" == "healthy" ]; then
  echo "✅ VITALITY SUCCESS: All services are healthy and operational."
else
  echo "❌ VITALITY FAILURE: One or more services failed healthchecks. Check 'docker logs nexus-server'."
  exit 1
fi

# 5. Network Handshake
echo "Step 5: Verifying API Handshake..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/api/admin/metrics || echo "FAILED")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
  echo "✅ HANDSHAKE SUCCESS: API is reachable via Nginx Reverse Proxy (Code: $HTTP_CODE)."
else
  echo "❌ HANDSHAKE FAILURE: API unreachable or Nginx routing error (Code: $HTTP_CODE)."
  exit 1
fi

echo "🏁 DEPLOYMENT VERIFIED. CyberShield X is Production-Stable."

#!/bin/bash

# 🛡️ Nexus Server Architect: Automated VPS Hardening (v1.0)
# Target OS: Ubuntu 24.04 / 22.04 LTS
# Purpose: Transform a fresh VPS into a hardened Nexus Core Host.

set -e

echo "🚀 INITIATING NEXUS SERVER ARCHITECT..."

# 1. Update & Base Cleanup
echo "Step 1: Auditing Host Packages..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git wget build-essential ufw software-properties-common

# 2. Docker & Compose Installation (Universal)
echo "Step 2: Installing Container Runtime..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully."
else
    echo "ℹ️ Docker already detected. Skipping."
fi

# 3. Perimeter Hardening (Firewall)
echo "Step 3: Hardening Network Perimeter (UFW)..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw --force enable
echo "✅ Firewall active. Ports 80/443 exposed."

# 4. Persistence Path Provisioning
echo "Step 4: Provisioning Forensic Storage..."
mkdir -p ./cybershield-x/backups
mkdir -p ./cybershield-x/logs
echo "✅ Storage hierarchy initialized."

# 5. Optimization (Timezone & Swap)
echo "Step 5: Optimizing Host Locality..."
sudo timedatectl set-timezone UTC
# Add 2GB Swap for low-resource VPS stability
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ 2GB Swap optimized."
fi

echo -e "\n🏁 HOST HARDENING COMPLETE."
echo "💡 NEXT STEP: Clone the Nexus Core repository and run './nexus-one-click.sh'."

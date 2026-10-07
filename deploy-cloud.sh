#!/usr/bin/env bash
# ==============================================================================
# AYIS Cloud VPS Automated Deployment Script
# Supports: Ubuntu 20.04+, Ubuntu 22.04+, Ubuntu 24.04+, Debian 11/12
# ==============================================================================
set -e

echo "=========================================================="
echo "    AYIS Cloud Server / VPS One-Command Deployment       "
echo "=========================================================="

# 1. Check or install Docker & Docker Compose
if ! command -v docker &>/dev/null; then
    echo "Docker not found. Installing Docker Engine..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER" || true
fi

if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
    echo "Installing Docker Compose plugin..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin docker-compose || true
fi

# 2. Setup production environment file if missing
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.production..."
    cp .env.production .env
fi

# 3. Build and spin up containers
echo "Starting AYIS Stack (MySQL 8 GIS + .NET 8 Backend + Nginx Frontend)..."
if docker compose version &>/dev/null; then
    docker compose up --build -d
else
    docker-compose up --build -d
fi

# 4. Determine Public IP
PUBLIC_IP=$(curl -s -4 ifconfig.me 2>/dev/null || curl -s -4 icanhazip.com 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo "=========================================================="
echo " ✅ AYIS IS LIVE AND ACCESSIBLE WORLDWIDE!"
echo "=========================================================="
echo " Public Web App:     http://${PUBLIC_IP}"
echo " API Health Check:   http://${PUBLIC_IP}/api/v1/health"
echo " Interactive Swagger: http://${PUBLIC_IP}/swagger"
echo ""
echo " Team members across any computer, phone, or tablet can"
echo " now open http://${PUBLIC_IP} to access the platform!"
echo "=========================================================="

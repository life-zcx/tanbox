#!/bin/bash
# ==============================================================================
# TANBOX Production Deployment Script
# ==============================================================================

set -e

echo "🚀 Starting TANBOX production deployment..."

# 1. Verify .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file does not exist! Please create .env based on .env.example before deploying."
    exit 1
fi

# 2. Pull base images and build production containers
echo "🔨 Building production Docker containers..."
docker compose build --pull

# 3. Apply database migrations
echo "🗄️ Running database migrations..."
docker compose run --rm backend npx prisma migrate deploy

# 4. Start all services in detached mode
echo "🚢 Starting TANBOX stack..."
docker compose up -d

# 5. Check container status
docker compose ps

echo "🎉 Deployment successfully finished!"
echo "🌐 Landing: https://tanbox.kz"
echo "🌐 Client Cabinet: https://lk.tanbox.kz"
echo "🌐 Admin Cabinet: https://admin.tanbox.kz"
echo "🌐 API Healthcheck: https://api.tanbox.kz/api/health"

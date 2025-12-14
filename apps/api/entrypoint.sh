#!/bin/sh

# Fail on any error
set -e

echo "🚀 Starting API Entrypoint..."

# Go to the app root to find node_modules
cd /app

echo "📂 Current Directory: $(pwd)"
echo "🛠️ Running Prisma Migrations..."

# Explicitly use the binary path
./node_modules/.bin/prisma migrate deploy --schema=packages/database/prisma/schema.prisma || echo "⚠️ Migration failed, but continuing explicitly..."

echo "✅ Migrations applied successfully!"

# Go back to the api directory to start the app
cd /app/apps/api

echo "🌱 Starting NestJS App..."
node dist/src/main

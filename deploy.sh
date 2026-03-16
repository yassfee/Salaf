#!/bin/bash

# Salaf Deployment Script for Dokpoly

echo "🚀 Starting Salaf deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your production values before deploying!"
    echo "🔑 Especially update JWT_SECRET with a secure 256-bit key"
    exit 1
fi

# Validate JWT_SECRET
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)
if [ "$JWT_SECRET" = "your-secure-256-bit-secret-key-change-in-production-must-be-at-least-256-bits" ]; then
    echo "❌ Please update JWT_SECRET in .env file with a secure key!"
    exit 1
fi

echo "✅ Environment configuration validated"

# Build and deploy
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Salaf backend is healthy and running!"
    echo "🌐 Backend available at: http://localhost:8080"
    echo "📊 Health endpoint: http://localhost:8080/api/health"
    echo "🔒 Security health: http://localhost:8080/api/health/security"
else
    echo "❌ Health check failed. Check logs:"
    docker-compose -f docker-compose.prod.yml logs salaf-backend
    exit 1
fi

echo "🎉 Deployment completed successfully!"
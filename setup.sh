#!/bin/bash

# eCommerce Platform Docker Setup Script
echo "🚀 Setting up eCommerce Platform with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start all services
echo "🐳 Building and starting all services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if all services are running
echo "🔍 Checking service status..."
docker-compose ps

# Check if PostgreSQL is healthy
echo "🐘 Checking PostgreSQL health..."
if ! docker-compose exec postgres pg_isready -U ecommerce_user -d ecommerce_db; then
    echo "❌ PostgreSQL is not ready. Check logs with: docker-compose logs postgres"
    exit 1
fi

echo "✅ All services are running!"

echo ""
echo "🎉 Setup complete! Your application is now running:"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "🐘 PostgreSQL: localhost:5432"
echo ""
echo "📊 Useful commands:"
echo "  View logs: docker-compose logs [service]"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Access API container: docker-compose exec api sh"
echo "  Access Web container: docker-compose exec web sh"
echo "  Access PostgreSQL: docker-compose exec postgres psql -U ecommerce_user -d ecommerce_db"
echo ""
echo "🔄 For development with hot reload, the services are already configured!"
echo "   Edit files in ./api or ./web and changes will be reflected automatically."

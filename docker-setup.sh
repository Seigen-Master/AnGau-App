#!/bin/bash
# AnGau App - Docker Setup Script

echo "🐳 AnGau App - Docker Setup"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "📥 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "🚀 Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is installed and running"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://fhnhewauxzznxpsfjdqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmhld2F1eHp6bnhwc2ZqZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjEwNTgsImV4cCI6MjA3ODI5NzA1OH0.gwD2aOgp8T0zUP4g7SLk5wMFe2eH2OupVJp2FdxY7Tk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmhld2F1eHp6bnhwc2ZqZHF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTA1OCwiZXhwIjoyMDc4Mjk3MDU4fQ.7JdqQrslBWYJP-6bTvWlLRE0sEzdRbzk-WDomuo-WOM
NEXT_PUBLIC_APP_URL=http://localhost:9002
NEXT_PUBLIC_APP_NAME=AnGau Care Management
NODE_ENV=development
EOF
    echo "✅ Created .env.local"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🚀 Starting Docker containers..."
echo ""

# Start development containers
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Docker containers are starting!"
echo ""
echo "📊 Status:"
docker-compose -f docker-compose.dev.yml ps
echo ""
echo "🌐 Your app will be available at: http://localhost:9002"
echo "📝 View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "🛑 Stop: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "⏳ Waiting for the app to start (this may take 1-2 minutes)..."
echo ""

# Wait for the app to be ready
sleep 10

echo "🎉 Setup complete! Open http://localhost:9002 in your browser"


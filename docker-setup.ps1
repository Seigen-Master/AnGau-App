# AnGau App - Docker Setup Script (PowerShell)

Write-Host "🐳 AnGau App - Docker Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker is not installed!" -ForegroundColor Red
    Write-Host "📥 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is installed and running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "🚀 Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if .env.local exists
if (-not (Test-Path .env.local)) {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    @"
NEXT_PUBLIC_SUPABASE_URL=https://fhnhewauxzznxpsfjdqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmhld2F1eHp6bnhwc2ZqZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjEwNTgsImV4cCI6MjA3ODI5NzA1OH0.gwD2aOgp8T0zUP4g7SLk5wMFe2eH2OupVJp2FdxY7Tk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmhld2F1eHp6bnhwc2ZqZHF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTA1OCwiZXhwIjoyMDc4Mjk3MDU4fQ.7JdqQrslBWYJP-6bTvWlLRE0sEzdRbzk-WDomuo-WOM
NEXT_PUBLIC_APP_URL=http://localhost:9002
NEXT_PUBLIC_APP_NAME=AnGau Care Management
NODE_ENV=development
"@ | Out-File -FilePath .env.local -Encoding utf8
    Write-Host "✅ Created .env.local" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting Docker containers..." -ForegroundColor Cyan
Write-Host ""

# Start development containers
docker compose -f docker-compose.dev.yml up -d

Write-Host ""
Write-Host "✅ Docker containers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Status:" -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml ps
Write-Host ""
Write-Host "🌐 Your app will be available at: http://localhost:9002" -ForegroundColor Green
Write-Host "📝 View logs: docker compose -f docker-compose.dev.yml logs -f" -ForegroundColor Yellow
Write-Host "🛑 Stop: docker compose -f docker-compose.dev.yml down" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏳ Waiting for the app to start (this may take 1-2 minutes)..." -ForegroundColor Cyan
Write-Host ""

# Wait for the app to be ready
Start-Sleep -Seconds 10

Write-Host "🎉 Setup complete! Open http://localhost:9002 in your browser" -ForegroundColor Green


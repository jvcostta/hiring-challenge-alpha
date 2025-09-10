# Multi-Source AI Agent Docker Setup Script for Windows
# PowerShell version

Write-Host "Multi-Source AI Agent - Docker Setup" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue

# Check if Docker is installed and running
try {
    docker --version | Out-Null
    Write-Host "Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Attempting to start Docker Desktop..." -ForegroundColor Yellow
    
    # Try to start Docker Desktop
    try {
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction Stop
        Write-Host "Docker Desktop is starting... Please wait 30-60 seconds for it to initialize." -ForegroundColor Yellow
        Write-Host "After Docker Desktop is ready, run this script again." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You can check if Docker is ready by running:" -ForegroundColor Cyan
        Write-Host "  docker info" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Then run this script again:" -ForegroundColor Cyan
        Write-Host "  .\docker-setup.ps1" -ForegroundColor Cyan
    } catch {
        Write-Host "Could not start Docker Desktop automatically." -ForegroundColor Red
        Write-Host "Please start Docker Desktop manually and run this script again." -ForegroundColor Yellow
    }
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "Docker Compose is not available. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Please edit .env file with your actual API keys before running the container." -ForegroundColor Yellow
    } else {
        Write-Host ".env.example file not found. Please create .env file manually." -ForegroundColor Red
        exit 1
    }
}

# Create logs directory if it doesn't exist
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
    Write-Host "Created logs directory" -ForegroundColor Green
}

Write-Host "Building Docker image..." -ForegroundColor Blue
docker-compose build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker image built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Start the agent:" -ForegroundColor Green
    Write-Host "  docker-compose up"
    Write-Host ""
    Write-Host "Start in detached mode:" -ForegroundColor Green
    Write-Host "  docker-compose up -d"
    Write-Host ""
    Write-Host "View logs:" -ForegroundColor Green
    Write-Host "  docker-compose logs -f"
    Write-Host ""
    Write-Host "Stop the agent:" -ForegroundColor Green
    Write-Host "  docker-compose down"
    Write-Host ""
    Write-Host "Access container shell:" -ForegroundColor Green
    Write-Host "  docker-compose exec multi-source-ai-agent sh"
    Write-Host ""
    Write-Host "Run tests:" -ForegroundColor Green
    Write-Host "  docker-compose exec multi-source-ai-agent npm test"
    Write-Host ""
    Write-Host "Remember to update your .env file with actual API keys!" -ForegroundColor Yellow
} else {
    Write-Host "Failed to build Docker image" -ForegroundColor Red
    exit 1
}

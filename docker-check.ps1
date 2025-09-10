# Quick Docker Status Check

Write-Host "=== Docker Status Check ===" -ForegroundColor Blue

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker daemon is running" -ForegroundColor Green
    
    # Show basic Docker info
    Write-Host "`nDocker system info:" -ForegroundColor Cyan
    docker version --format "  Client: {{.Client.Version}}"
    docker version --format "  Server: {{.Server.Version}}"
    
    Write-Host "`n✓ Docker is ready for use!" -ForegroundColor Green
    Write-Host "You can now run:" -ForegroundColor Yellow
    Write-Host "  docker-compose build" -ForegroundColor Cyan
    Write-Host "  docker-compose up" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Docker daemon is not running" -ForegroundColor Red
    Write-Host "`nTo fix this:" -ForegroundColor Yellow
    Write-Host "1. Start Docker Desktop from Start Menu or Desktop" -ForegroundColor White
    Write-Host "2. Wait for Docker Desktop to fully initialize (30-60 seconds)" -ForegroundColor White
    Write-Host "3. Look for Docker icon in system tray" -ForegroundColor White
    Write-Host "4. Run this check again: .\docker-check.ps1" -ForegroundColor White
    
    # Try to start Docker Desktop
    Write-Host "`nAttempting to start Docker Desktop..." -ForegroundColor Yellow
    try {
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction Stop
        Write-Host "Docker Desktop is starting..." -ForegroundColor Green
    } catch {
        Write-Host "Could not start Docker Desktop automatically." -ForegroundColor Red
        Write-Host "Please start it manually from the Start Menu." -ForegroundColor Yellow
    }
}

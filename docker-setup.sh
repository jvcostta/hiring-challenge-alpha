#!/bin/bash

# Multi-Source AI Agent Docker Setup Script

set -e

echo "🐳 Multi-Source AI Agent - Docker Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}📝 Please edit .env file with your actual API keys before running the container.${NC}"
    else
        echo -e "${RED}❌ .env.example file not found. Please create .env file manually.${NC}"
        exit 1
    fi
fi

# Create logs directory if it doesn't exist
mkdir -p logs

echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker-compose build

echo -e "${GREEN}✅ Docker image built successfully!${NC}"
echo ""
echo -e "${BLUE}🚀 Available commands:${NC}"
echo ""
echo -e "${GREEN}Start the agent:${NC}"
echo "  docker-compose up"
echo ""
echo -e "${GREEN}Start in detached mode:${NC}"
echo "  docker-compose up -d"
echo ""
echo -e "${GREEN}View logs:${NC}"
echo "  docker-compose logs -f"
echo ""
echo -e "${GREEN}Stop the agent:${NC}"
echo "  docker-compose down"
echo ""
echo -e "${GREEN}Access container shell:${NC}"
echo "  docker-compose exec multi-source-ai-agent sh"
echo ""
echo -e "${GREEN}Run tests:${NC}"
echo "  docker-compose exec multi-source-ai-agent npm test"
echo ""
echo -e "${YELLOW}💡 Remember to update your .env file with actual API keys!${NC}"

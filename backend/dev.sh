#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=================================================="
echo "  Jobber Clone Backend - Development Mode"
echo "=================================================="
echo -e "${NC}"

# Check if Docker services are running
if ! docker-compose ps | grep -q "postgres.*Up"; then
    echo -e "${YELLOW}Starting Docker services...${NC}"
    docker-compose up -d postgres redis
    sleep 3
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Start the development server
echo -e "${GREEN}Starting NestJS development server...${NC}"
echo -e "${BLUE}Access the API at: http://localhost:8080/api${NC}"
echo -e "${BLUE}Swagger docs at: http://localhost:8080/api/docs${NC}"
echo ""

npm run start:dev

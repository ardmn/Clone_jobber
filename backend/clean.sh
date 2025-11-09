#!/bin/bash

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Cleaning up Jobber Clone Backend...${NC}"

# Stop and remove containers
docker-compose down -v

# Remove node_modules (optional)
read -p "Remove node_modules? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf node_modules
    echo -e "${GREEN}✓ node_modules removed${NC}"
fi

# Remove .env (optional)
read -p "Remove .env file? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f .env
    echo -e "${GREEN}✓ .env removed${NC}"
fi

echo -e "${GREEN}✓ Cleanup complete${NC}"
echo -e "${YELLOW}Run ./setup.sh to set up again${NC}"

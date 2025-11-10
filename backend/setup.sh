#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=================================================="
echo "  Jobber Clone Backend - Quick Setup Script"
echo "=================================================="
echo -e "${NC}"

# Check if running from backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory${NC}"
    exit 1
fi

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed. Please install Node.js 18+ first.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed.${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed. Please install Docker first.${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}docker-compose is required but not installed.${NC}"; exit 1; }

echo -e "${GREEN}✓ All prerequisites are installed${NC}"

# Step 2: Install dependencies
echo -e "\n${BLUE}Step 2: Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Setup environment file
echo -e "\n${BLUE}Step 3: Setting up environment file...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ .env file created from .env.example${NC}"
    echo -e "${YELLOW}⚠ Please edit .env and add your API keys (Stripe, SendGrid, Twilio, AWS)${NC}"
    echo -e "${YELLOW}  The app will work without them, but payment/email/SMS features will be limited${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 4: Start Docker services
echo -e "\n${BLUE}Step 4: Starting Docker services (PostgreSQL + Redis)...${NC}"
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo -e "${BLUE}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U jobber > /dev/null 2>&1; do
    echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Step 5: Run migrations
echo -e "\n${BLUE}Step 5: Running database migrations...${NC}"
npm run typeorm migration:run
echo -e "${GREEN}✓ Migrations completed${NC}"

# Step 6: Seed demo data
echo -e "\n${BLUE}Step 6: Seeding demo data (optional)...${NC}"
read -p "Do you want to seed demo data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
    echo -e "${GREEN}✓ Demo data seeded${NC}"
    echo -e "${YELLOW}Demo credentials:${NC}"
    echo -e "  Email: ${GREEN}admin@example.com${NC}"
    echo -e "  Password: ${GREEN}password123${NC}"
else
    echo -e "${YELLOW}Skipped demo data seeding${NC}"
fi

# Step 7: Success message
echo -e "\n${GREEN}"
echo "=================================================="
echo "  ✓ Setup Complete!"
echo "=================================================="
echo -e "${NC}"
echo -e "To start the backend server, run:"
echo -e "${BLUE}  npm run start:dev${NC}"
echo ""
echo -e "Or use the convenience script:"
echo -e "${BLUE}  ./dev.sh${NC}"
echo ""
echo -e "API will be available at:"
echo -e "  ${GREEN}http://localhost:8080/api${NC}"
echo ""
echo -e "Swagger documentation:"
echo -e "  ${GREEN}http://localhost:8080/api/docs${NC}"
echo ""
echo -e "Health check:"
echo -e "  ${GREEN}http://localhost:8080/api/health${NC}"
echo ""
echo -e "${YELLOW}Note: Don't forget to configure your API keys in .env file!${NC}"

#!/bin/bash

echo "================================================"
echo "COMMUNICATIONS MODULE - VERIFICATION SCRIPT"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check files exist
echo "Checking if all files exist..."
echo ""

files=(
  "src/integrations/sendgrid/sendgrid.module.ts"
  "src/integrations/sendgrid/sendgrid.service.ts"
  "src/integrations/twilio/twilio.module.ts"
  "src/integrations/twilio/twilio.service.ts"
  "src/modules/communications/communications.module.ts"
  "src/modules/communications/communications.controller.ts"
  "src/modules/communications/communications.service.ts"
  "src/modules/communications/dtos/index.ts"
  "src/modules/communications/dtos/send-email.dto.ts"
  "src/modules/communications/dtos/send-sms.dto.ts"
  "src/modules/communications/dtos/send-bulk-email.dto.ts"
  "src/modules/communications/dtos/send-bulk-sms.dto.ts"
  "src/modules/communications/dtos/create-template.dto.ts"
  "src/modules/communications/dtos/messages-query.dto.ts"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
  else
    echo -e "${RED}✗${NC} $file (MISSING)"
    all_exist=false
  fi
done

echo ""

# Check for TODOs
echo "Checking for TODOs..."
echo ""

todo_count=$(grep -r "TODO\|FIXME\|XXX\|HACK" src/integrations/sendgrid src/integrations/twilio src/modules/communications 2>/dev/null | wc -l)

if [ "$todo_count" -eq 0 ]; then
  echo -e "${GREEN}✓${NC} No TODOs found - Clean implementation"
else
  echo -e "${RED}✗${NC} Found $todo_count TODOs"
fi

echo ""

# Check dependencies
echo "Checking dependencies..."
echo ""

if grep -q "@sendgrid/mail" package.json; then
  echo -e "${GREEN}✓${NC} @sendgrid/mail in package.json"
else
  echo -e "${RED}✗${NC} @sendgrid/mail NOT in package.json"
fi

if grep -q "twilio" package.json; then
  echo -e "${GREEN}✓${NC} twilio in package.json"
else
  echo -e "${RED}✗${NC} twilio NOT in package.json"
fi

echo ""

# Check environment variables
echo "Checking environment configuration..."
echo ""

if [ -f ".env.communications.example" ]; then
  echo -e "${GREEN}✓${NC} .env.communications.example exists"
else
  echo -e "${YELLOW}!${NC} .env.communications.example not found"
fi

if [ -f ".env" ]; then
  echo -e "${GREEN}✓${NC} .env file exists"
  
  # Check for required variables
  if grep -q "SENDGRID_API_KEY" .env; then
    echo -e "${GREEN}  ✓${NC} SENDGRID_API_KEY configured"
  else
    echo -e "${YELLOW}  !${NC} SENDGRID_API_KEY not configured (optional for testing)"
  fi
  
  if grep -q "TWILIO_ACCOUNT_SID" .env; then
    echo -e "${GREEN}  ✓${NC} TWILIO_ACCOUNT_SID configured"
  else
    echo -e "${YELLOW}  !${NC} TWILIO_ACCOUNT_SID not configured (optional for testing)"
  fi
else
  echo -e "${YELLOW}!${NC} .env file not found - create from .env.example"
fi

echo ""

# Check module import in app.module.ts
echo "Checking app.module.ts..."
echo ""

if grep -q "CommunicationsModule" src/app.module.ts; then
  echo -e "${GREEN}✓${NC} CommunicationsModule imported in app.module.ts"
else
  echo -e "${RED}✗${NC} CommunicationsModule NOT imported in app.module.ts"
fi

echo ""

# Summary
echo "================================================"
echo "VERIFICATION SUMMARY"
echo "================================================"
echo ""

if [ "$all_exist" = true ] && [ "$todo_count" -eq 0 ]; then
  echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Configure environment variables in .env"
  echo "2. Run: npm install"
  echo "3. Run: npm run start:dev"
  echo "4. Test at: http://localhost:3000/api"
else
  echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
  echo ""
  echo "Please review the errors above."
fi

echo ""

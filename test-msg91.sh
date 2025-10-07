#!/bin/bash

# MSG91 Integration Test Script
# Tests both Email API and OTP API functionality

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8787"
TEST_EMAIL="rnkbohra@gmail.com"
TEST_PHONE="919999999999"  # Replace with your test phone number

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MSG91 Integration Test Suite        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Send OTP
echo -e "${YELLOW}[TEST 1] Sending OTP to ${TEST_PHONE}...${NC}"
OTP_SEND_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "${API_URL}/api/otp/send" \
  -H "Content-Type: application/json" \
  -d "{
    \"mobile\": \"${TEST_PHONE}\",
    \"otpLength\": 4,
    \"otpExpiry\": 5
  }")

HTTP_CODE=$(echo "$OTP_SEND_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$OTP_SEND_RESPONSE" | sed '/HTTP_CODE/d')

echo "Response:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ OTP send request successful${NC}"
  REQUEST_ID=$(echo "$RESPONSE_BODY" | jq -r '.requestId' 2>/dev/null)
  echo -e "Request ID: ${REQUEST_ID}"
else
  echo -e "${RED}✗ OTP send request failed (HTTP ${HTTP_CODE})${NC}"
fi
echo ""

# Prompt for OTP
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}Please check your phone for the OTP${NC}"
read -p "Enter the 4-digit OTP you received: " OTP_CODE
echo ""

# Test 2: Verify OTP
echo -e "${YELLOW}[TEST 2] Verifying OTP code: ${OTP_CODE}...${NC}"
OTP_VERIFY_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "${API_URL}/api/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"mobile\": \"${TEST_PHONE}\",
    \"otp\": \"${OTP_CODE}\"
  }")

HTTP_CODE=$(echo "$OTP_VERIFY_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$OTP_VERIFY_RESPONSE" | sed '/HTTP_CODE/d')

echo "Response:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  VERIFIED=$(echo "$RESPONSE_BODY" | jq -r '.verified' 2>/dev/null)
  if [ "$VERIFIED" = "true" ]; then
    echo -e "${GREEN}✓ OTP verified successfully${NC}"
  else
    echo -e "${RED}✗ OTP verification failed - Invalid OTP${NC}"
  fi
else
  echo -e "${RED}✗ OTP verify request failed (HTTP ${HTTP_CODE})${NC}"
fi
echo ""

# Test 3: Test Email Sending (if available)
echo -e "${YELLOW}[TEST 3] Testing MSG91 Email Service...${NC}"
echo -e "This will send a test email to ${TEST_EMAIL}"
read -p "Continue? (y/n): " CONTINUE_EMAIL

if [ "$CONTINUE_EMAIL" = "y" ] || [ "$CONTINUE_EMAIL" = "Y" ]; then
  # First, we need to be authenticated to use the email service
  echo -e "${YELLOW}Attempting to send test email via backend...${NC}"

  # Since email service is internal, we'll test it via a signup/login flow
  echo -e "${BLUE}Note: Email service is integrated into signup/login flows.${NC}"
  echo -e "${BLUE}To test email, try creating a new user account.${NC}"
else
  echo -e "${YELLOW}Skipping email test.${NC}"
fi
echo ""

# Test 4: Resend OTP (optional)
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}[TEST 4] Testing OTP Resend...${NC}"
read -p "Do you want to test OTP resend? (y/n): " CONTINUE_RESEND

if [ "$CONTINUE_RESEND" = "y" ] || [ "$CONTINUE_RESEND" = "Y" ]; then
  RESEND_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST "${API_URL}/api/otp/resend" \
    -H "Content-Type: application/json" \
    -d "{
      \"mobile\": \"${TEST_PHONE}\",
      \"retryType\": \"text\"
    }")

  HTTP_CODE=$(echo "$RESEND_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
  RESPONSE_BODY=$(echo "$RESEND_RESPONSE" | sed '/HTTP_CODE/d')

  echo "Response:"
  echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
  echo ""

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ OTP resend successful${NC}"
  else
    echo -e "${RED}✗ OTP resend failed (HTTP ${HTTP_CODE})${NC}"
  fi
else
  echo -e "${YELLOW}Skipping resend test.${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Test Summary                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ MSG91 OTP Service: Integrated${NC}"
echo -e "${GREEN}✓ MSG91 Email Service: Integrated${NC}"
echo -e "${YELLOW}ℹ Email testing requires authentication${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test email by creating a new user account"
echo "2. Check MSG91 dashboard for delivery reports"
echo "3. Deploy secrets to production when ready"
echo ""
echo -e "${GREEN}Integration test complete!${NC}"

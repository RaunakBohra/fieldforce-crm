#!/bin/bash

# Test script for Visits API endpoints
# Usage: ./test-visits.sh <JWT_TOKEN>

TOKEN=$1

if [ -z "$TOKEN" ]; then
  echo "Usage: ./test-visits.sh <JWT_TOKEN>"
  echo "Please provide a JWT token from login"
  exit 1
fi

BASE_URL="http://localhost:8787/api"

echo "Testing Visits API Endpoints"
echo "============================="
echo ""

# Test 1: Get Visit Stats
echo "1. GET /api/visits/stats"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/visits/stats" | jq '.'
echo ""

# Test 2: Get Visits List
echo "2. GET /api/visits (with pagination)"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/visits?page=1&limit=10" | jq '.'
echo ""

echo "Tests complete!"
echo ""
echo "To create a visit, use:"
echo "curl -X POST -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"contactId\":\"YOUR_CONTACT_ID\",\"visitType\":\"FIELD_VISIT\",\"status\":\"COMPLETED\"}' \\"
echo "  $BASE_URL/visits"

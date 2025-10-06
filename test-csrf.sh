#!/bin/bash

# Get CSRF token
echo "1. Fetching CSRF token..."
RESPONSE=$(curl -s "https://fieldforce-crm-api.rnkbohra.workers.dev/api/csrf-token" -c /tmp/csrf-cookies.txt)
CSRF_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['csrfToken'])")
echo "   CSRF Token: ${CSRF_TOKEN:0:50}..."

# Test POST with CSRF token
echo ""
echo "2. Testing POST with CSRF token..."
curl -s -X POST "https://fieldforce-crm-api.rnkbohra.workers.dev/api/contacts" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWdlcnM2ZG4wMDAwMnlkOHRpZWJ2YmIzIiwiZW1haWwiOiJwcm9kdGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJGSUVMRF9SRVAiLCJleHAiOjE3NjAzMzg5MDR9.2uwhneiPKQoBTDXzaKkPzHQSIFSJDkp9FY6N1E7mSp0" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -b /tmp/csrf-cookies.txt \
  -d '{"name":"CSRF Test Success","contactCategory":"MEDICAL","contactType":"DOCTOR"}' | python3 -m json.tool

echo ""
echo "✅ CSRF test complete!"

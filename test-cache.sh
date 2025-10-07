#!/bin/bash

# Test script to verify caching is working
# This tests territory-performance endpoint

echo "=== Testing Territory Performance Caching ==="
echo ""

# Get auth token first (replace with valid credentials)
echo "1. Getting auth token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Got auth token"
echo ""

# Test 1: First request (should be cache miss)
echo "2. First request (expect: cache miss, database query)..."
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
  http://localhost:8787/api/analytics/territory-performance \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE1"
echo ""
sleep 1

# Test 2: Second request (should be memory cache hit)
echo "3. Second request (expect: memory cache hit, < 1ms)..."
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
  http://localhost:8787/api/analytics/territory-performance \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE2"
echo ""
sleep 1

# Test 3: Third request (should still be memory cache hit)
echo "4. Third request (expect: memory cache hit, < 1ms)..."
RESPONSE3=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
  http://localhost:8787/api/analytics/territory-performance \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE3"
echo ""

echo "=== Test Complete ==="
echo ""
echo "Check the server logs for cache hit/miss messages"

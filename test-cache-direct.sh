#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWdmdHRwcXcwMDAwaHozNjhzZWJrd25zIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzU5ODAxMzE2fQ.7rev_8dA3-QHGfJz63cJooVuu-OJUqDPNr-2syU8wHY"

echo "=== Request 1: Cache MISS (database query) ==="
curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}\n" \
  http://localhost:8787/api/analytics/territory-performance \
  -H "Authorization: Bearer $TOKEN" | head -15
echo ""
sleep 2

echo "=== Request 2: Memory cache HIT (< 1ms) ==="
curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}\n" \
  http://localhost:8787/api/analytics/territory-performance \
  -H "Authorization: Bearer $TOKEN" | head -15
echo ""
sleep 2

echo "=== Request 3: Memory cache HIT (< 1ms) ==="
curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}\n" \
  http://localhost:8787/api/analytics/territory-performance \
  -H "Authorization: Bearer $TOKEN" | head -15

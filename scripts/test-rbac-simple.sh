#!/bin/bash

# Simple RBAC Test
# Run this after starting the dev server: npm run dev

API_URL="${API_URL:-http://localhost:8787}"

echo "======================================"
echo "🔐 Simple RBAC Test"
echo "======================================"
echo ""
echo "API URL: $API_URL"
echo ""

# Test 1: Access protected endpoint without auth
echo "Test 1: Access /api/users without token (should be 401)"
echo "--------------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/api/users"
echo ""
echo ""

# Test 2: Try to get CSRF token (public endpoint)
echo "Test 2: Get CSRF token (should be 200)"
echo "--------------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/api/auth/csrf-token"
echo ""
echo ""

# Test 3: Check health endpoint
echo "Test 3: Health check (should be 200)"
echo "--------------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL/health"
echo ""
echo ""

echo "======================================"
echo "📝 To test full RBAC:"
echo "======================================"
echo ""
echo "1. Start the server: npm run dev"
echo ""
echo "2. Create test users in database:"
echo "   - Admin: admin@test.com (role: ADMIN)"
echo "   - Manager: manager@test.com (role: MANAGER)"
echo "   - Field Rep: fieldrep@test.com (role: FIELD_REP)"
echo ""
echo "3. Login and get tokens:"
echo "   curl -X POST $API_URL/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@test.com\",\"password\":\"your_password\"}'"
echo ""
echo "4. Test protected endpoints:"
echo "   # Should succeed (ADMIN)"
echo "   curl -H 'Authorization: Bearer <ADMIN_TOKEN>' $API_URL/api/users"
echo ""
echo "   # Should fail with 403 (FIELD_REP)"
echo "   curl -H 'Authorization: Bearer <FIELD_REP_TOKEN>' $API_URL/api/users"
echo ""

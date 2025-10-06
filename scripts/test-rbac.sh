#!/bin/bash

# RBAC Testing Script
# Tests role-based access control for different user roles

set -e

API_URL="http://localhost:8787"
ADMIN_EMAIL="admin@test.com"
MANAGER_EMAIL="manager@test.com"
FIELD_REP_EMAIL="fieldrep@test.com"
PASSWORD="TestPassword123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "🔐 RBAC Testing Suite"
echo "========================================="
echo ""

# Check if server is running
echo "📡 Checking if server is running..."
if ! curl -s "$API_URL/health" > /dev/null; then
    echo -e "${RED}❌ Server is not running on $API_URL${NC}"
    echo "Please start the server: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Function to create test users
create_test_users() {
    echo "👥 Creating test users..."

    # Note: This requires database access or admin account
    # For now, we'll assume users exist or skip this step
    echo -e "${YELLOW}⚠️  Assuming test users already exist in database${NC}"
    echo "   - admin@test.com (ADMIN)"
    echo "   - manager@test.com (MANAGER)"
    echo "   - fieldrep@test.com (FIELD_REP)"
    echo ""
}

# Function to login and get token
login() {
    local email=$1
    local password=$2

    response=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")

    token=$(echo $response | grep -o '"token":"[^"]*' | sed 's/"token":"//')

    if [ -z "$token" ]; then
        echo -e "${RED}❌ Failed to login as $email${NC}"
        echo "Response: $response"
        return 1
    fi

    echo "$token"
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local token=$3
    local expected_status=$4
    local description=$5

    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json")

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $description"
        echo "   Expected: $expected_status, Got: $http_code"
    else
        echo -e "${RED}❌ FAIL${NC}: $description"
        echo "   Expected: $expected_status, Got: $http_code"
        echo "   Response: $body"
    fi
    echo ""
}

# Function to test with POST data
test_endpoint_with_data() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    local expected_status=$5
    local description=$6

    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$data")

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $description"
        echo "   Expected: $expected_status, Got: $http_code"
    else
        echo -e "${RED}❌ FAIL${NC}: $description"
        echo "   Expected: $expected_status, Got: $http_code"
        echo "   Response: $body"
    fi
    echo ""
}

# Run tests
main() {
    create_test_users

    echo "========================================="
    echo "🔑 Step 1: Login as different users"
    echo "========================================="
    echo ""

    echo "Logging in as ADMIN..."
    ADMIN_TOKEN=$(login "$ADMIN_EMAIL" "$PASSWORD")
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Admin token acquired${NC}"
        echo "Token: ${ADMIN_TOKEN:0:20}..."
    fi
    echo ""

    echo "Logging in as MANAGER..."
    MANAGER_TOKEN=$(login "$MANAGER_EMAIL" "$PASSWORD")
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Manager token acquired${NC}"
        echo "Token: ${MANAGER_TOKEN:0:20}..."
    fi
    echo ""

    echo "Logging in as FIELD_REP..."
    FIELD_REP_TOKEN=$(login "$FIELD_REP_EMAIL" "$PASSWORD")
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Field Rep token acquired${NC}"
        echo "Token: ${FIELD_REP_TOKEN:0:20}..."
    fi
    echo ""

    echo "========================================="
    echo "🧪 Step 2: Test User Management (ADMIN only)"
    echo "========================================="
    echo ""

    # Test 1: ADMIN can list users (requireManager - ADMIN + MANAGER)
    test_endpoint "GET" "/api/users?page=1&limit=10" "$ADMIN_TOKEN" 200 \
        "ADMIN can list users"

    # Test 2: MANAGER can list users (requireManager)
    test_endpoint "GET" "/api/users?page=1&limit=10" "$MANAGER_TOKEN" 200 \
        "MANAGER can list users"

    # Test 3: FIELD_REP cannot list users (requireManager)
    test_endpoint "GET" "/api/users?page=1&limit=10" "$FIELD_REP_TOKEN" 403 \
        "FIELD_REP cannot list users (403 Forbidden)"

    # Test 4: ADMIN can create user (requireAdmin)
    test_endpoint_with_data "POST" "/api/users" "$ADMIN_TOKEN" \
        '{"email":"newuser@test.com","name":"New User","password":"Pass123","role":"FIELD_REP"}' \
        201 "ADMIN can create user"

    # Test 5: MANAGER cannot create user (requireAdmin)
    test_endpoint_with_data "POST" "/api/users" "$MANAGER_TOKEN" \
        '{"email":"blocked@test.com","name":"Blocked","password":"Pass123","role":"FIELD_REP"}' \
        403 "MANAGER cannot create user (403 Forbidden)"

    # Test 6: FIELD_REP cannot create user (requireAdmin)
    test_endpoint_with_data "POST" "/api/users" "$FIELD_REP_TOKEN" \
        '{"email":"blocked2@test.com","name":"Blocked","password":"Pass123","role":"ADMIN"}' \
        403 "FIELD_REP cannot create user (403 Forbidden)"

    echo "========================================="
    echo "🧪 Step 3: Test Territory Management (MANAGER+)"
    echo "========================================="
    echo ""

    # Test 7: ADMIN can list territories
    test_endpoint "GET" "/api/territories" "$ADMIN_TOKEN" 200 \
        "ADMIN can list territories"

    # Test 8: MANAGER can list territories
    test_endpoint "GET" "/api/territories" "$MANAGER_TOKEN" 200 \
        "MANAGER can list territories"

    # Test 9: FIELD_REP can list territories (read is allowed)
    test_endpoint "GET" "/api/territories" "$FIELD_REP_TOKEN" 200 \
        "FIELD_REP can list territories (read access)"

    # Test 10: MANAGER can create territory (requireManager)
    test_endpoint_with_data "POST" "/api/territories" "$MANAGER_TOKEN" \
        '{"name":"Test Territory","region":"North","description":"Test"}' \
        201 "MANAGER can create territory"

    # Test 11: FIELD_REP cannot create territory (requireManager)
    test_endpoint_with_data "POST" "/api/territories" "$FIELD_REP_TOKEN" \
        '{"name":"Blocked Territory","region":"South","description":"Test"}' \
        403 "FIELD_REP cannot create territory (403 Forbidden)"

    echo "========================================="
    echo "🧪 Step 4: Test Product Management (MANAGER+)"
    echo "========================================="
    echo ""

    # Test 12: FIELD_REP can list products (read access)
    test_endpoint "GET" "/api/products?page=1&limit=10" "$FIELD_REP_TOKEN" 200 \
        "FIELD_REP can list products (read access)"

    # Test 13: MANAGER can create product (requireManager)
    test_endpoint_with_data "POST" "/api/products" "$MANAGER_TOKEN" \
        '{"name":"Test Product","sku":"TEST-001","price":100,"isActive":true}' \
        201 "MANAGER can create product"

    # Test 14: FIELD_REP cannot create product (requireManager)
    test_endpoint_with_data "POST" "/api/products" "$FIELD_REP_TOKEN" \
        '{"name":"Blocked Product","sku":"BLOCK-001","price":50,"isActive":true}' \
        403 "FIELD_REP cannot create product (403 Forbidden)"

    echo "========================================="
    echo "🧪 Step 5: Test Order Approval (MANAGER+)"
    echo "========================================="
    echo ""

    # Test 15: FIELD_REP can create order (no RBAC restriction)
    test_endpoint_with_data "POST" "/api/orders" "$FIELD_REP_TOKEN" \
        '{"contactId":"test-contact-id","items":[{"productId":"test-prod","quantity":1,"price":100}]}' \
        201 "FIELD_REP can create order (expected failure: contact not found)"

    # Note: Order status update tests require existing order ID
    # Skipping for now - would need to create order first

    echo "========================================="
    echo "📊 Test Summary"
    echo "========================================="
    echo ""
    echo "Tests completed! Review results above."
    echo ""
    echo "Expected Results:"
    echo "✅ ADMIN should pass all tests"
    echo "✅ MANAGER should pass manager-level tests, fail admin-only tests"
    echo "✅ FIELD_REP should only access read endpoints and own resources"
    echo ""
}

# Run main function
main

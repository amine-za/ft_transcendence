#!/bin/bash
# Manual Testing Script
# Run this after making changes to verify everything works

echo "=== Testing Backend Endpoints ==="

BASE_URL="https://localhost:443"

echo -e "\n1. Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -k -X POST "$BASE_URL/signup/" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","email":"test123@test.com","password":"test123"}')
echo "$SIGNUP_RESPONSE"

echo -e "\n2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -k -X POST "$BASE_URL/login/" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","password":"test123"}')
echo "$LOGIN_RESPONSE"

echo -e "\n3. Testing Get 2FA Status..."
GET_2FA_RESPONSE=$(curl -s -k -X POST "$BASE_URL/get2fa/" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123"}')
echo "$GET_2FA_RESPONSE"

echo -e "\n4. Testing Set 2FA Status (Enable)..."
SET_2FA_RESPONSE=$(curl -s -k -X PUT "$BASE_URL/set2fa/" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","two_factor_enabled":true}')
echo "$SET_2FA_RESPONSE"

echo -e "\n5. Verifying 2FA Status Changed..."
VERIFY_2FA_RESPONSE=$(curl -s -k -X POST "$BASE_URL/get2fa/" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123"}')
echo "$VERIFY_2FA_RESPONSE"

echo -e "\n=== Testing Complete ==="
echo "Check responses above for any errors"

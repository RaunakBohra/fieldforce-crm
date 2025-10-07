#!/bin/bash

# Deploy MSG91 Secrets to Cloudflare Workers
# This script uploads MSG91 credentials as encrypted secrets

export CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf

echo "🔐 Deploying MSG91 secrets to Cloudflare Workers..."
echo ""

# MSG91 Auth Key (Primary credential for Email + OTP)
echo "📧 Setting MSG91_AUTH_KEY..."
printf "460963AsJWGjhc68e48e5eP1" | npx wrangler secret put MSG91_AUTH_KEY

# MSG91 Email Configuration
echo "📧 Setting MSG91_EMAIL_DOMAIN..."
printf "qtoedo.mailer91.com" | npx wrangler secret put MSG91_EMAIL_DOMAIN

echo "📧 Setting MSG91_EMAIL_FROM..."
printf "no-reply@qtoedo.mailer91.com" | npx wrangler secret put MSG91_EMAIL_FROM

echo "📧 Setting MSG91_EMAIL_FROM_NAME..."
printf "Field Force CRM" | npx wrangler secret put MSG91_EMAIL_FROM_NAME

echo ""
echo "✅ MSG91 secrets deployed successfully!"
echo ""
echo "Verifying secrets..."
npx wrangler secret list

echo ""
echo "📝 Summary:"
echo "  ✓ MSG91_AUTH_KEY - Primary API credential"
echo "  ✓ MSG91_EMAIL_DOMAIN - Email sending domain"
echo "  ✓ MSG91_EMAIL_FROM - From email address"
echo "  ✓ MSG91_EMAIL_FROM_NAME - From display name"
echo ""
echo "🎉 MSG91 integration is now ready for production!"
echo ""
echo "Next steps:"
echo "1. Test OTP functionality: ./test-msg91.sh"
echo "2. Deploy backend: npx wrangler deploy"
echo "3. Test in production environment"

#!/bin/bash

# Deploy secrets to Cloudflare Workers
# Run this script to set all production secrets

export CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf

echo "🔐 Deploying secrets to Cloudflare Workers..."

# SMTP Configuration
echo "Setting SMTP secrets..."
printf "email-smtp.us-east-1.amazonaws.com" | npx wrangler secret put SMTP_HOST
printf "587" | npx wrangler secret put SMTP_PORT
printf "false" | npx wrangler secret put SMTP_SECURE
printf "AKIAYWBJYE26B7FOIELQ" | npx wrangler secret put SMTP_USERNAME
printf "BEO/KP7cN/xRI+7pFPniDLxAiZru322XB3UP/e+FhAPm" | npx wrangler secret put SMTP_PASSWORD
printf "noreply@yourdomain.com" | npx wrangler secret put SMTP_FROM_EMAIL
printf "Field Force CRM" | npx wrangler secret put SMTP_FROM_NAME

echo "✅ Secrets deployed successfully!"
echo ""
echo "📋 Current secrets:"
npx wrangler secret list

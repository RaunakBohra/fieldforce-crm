#!/bin/bash

# Production Secrets Deployment Script for Cloudflare Workers
# This script sets up all required environment variables as Cloudflare secrets
# Run this ONCE before deploying to production

set -e

echo "🚀 Field Force CRM - Production Secrets Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Please install it first:${NC}"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Cloudflare. Please login first:${NC}"
    echo "wrangler login"
    exit 1
fi

echo -e "${GREEN}✅ Wrangler CLI ready${NC}"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3

    echo -e "${YELLOW}Setting: ${secret_name}${NC} - ${description}"
    echo "$secret_value" | wrangler secret put "$secret_name" > /dev/null 2>&1
    echo -e "${GREEN}✅ ${secret_name} set successfully${NC}"
    echo ""
}

# ============================================
# 1. DATABASE CONFIGURATION
# ============================================
echo "📦 1. Database Configuration"
echo "----------------------------"

read -p "Enter DATABASE_URL (Neon PostgreSQL): " DATABASE_URL
set_secret "DATABASE_URL" "$DATABASE_URL" "Neon PostgreSQL connection string"

# ============================================
# 2. JWT AUTHENTICATION
# ============================================
echo "🔐 2. JWT Authentication"
echo "-----------------------"

read -p "Enter JWT_SECRET (use: openssl rand -base64 32): " JWT_SECRET
set_secret "JWT_SECRET" "$JWT_SECRET" "JWT signing secret"

# JWT_EXPIRES_IN is not secret, can be in wrangler.toml
echo -e "${YELLOW}ℹ️  JWT_EXPIRES_IN can be set in wrangler.toml (default: 15m)${NC}"
echo ""

# ============================================
# 3. MSG91 CONFIGURATION (OTP & Email)
# ============================================
echo "📱 3. MSG91 Configuration (OTP & Email)"
echo "---------------------------------------"

read -p "Enter MSG91_AUTH_KEY: " MSG91_AUTH_KEY
set_secret "MSG91_AUTH_KEY" "$MSG91_AUTH_KEY" "MSG91 authentication key"

read -p "Enter MSG91_API_KEY: " MSG91_API_KEY
set_secret "MSG91_API_KEY" "$MSG91_API_KEY" "MSG91 API key for SMS/WhatsApp"

read -p "Enter MSG91_EMAIL_DOMAIN (e.g., yourdomain.mailer91.com): " MSG91_EMAIL_DOMAIN
set_secret "MSG91_EMAIL_DOMAIN" "$MSG91_EMAIL_DOMAIN" "MSG91 email domain"

read -p "Enter MSG91_EMAIL_FROM (e.g., no-reply@yourdomain.mailer91.com): " MSG91_EMAIL_FROM
set_secret "MSG91_EMAIL_FROM" "$MSG91_EMAIL_FROM" "MSG91 from email address"

read -p "Enter MSG91_EMAIL_FROM_NAME (e.g., Field Force CRM): " MSG91_EMAIL_FROM_NAME
set_secret "MSG91_EMAIL_FROM_NAME" "$MSG91_EMAIL_FROM_NAME" "MSG91 from name"

read -p "Enter MSG91_SENDER_ID (for SMS, e.g., MSGIND): " MSG91_SENDER_ID
set_secret "MSG91_SENDER_ID" "$MSG91_SENDER_ID" "MSG91 SMS sender ID"

read -p "Enter MSG91_WHATSAPP_NUMBER (optional, press Enter to skip): " MSG91_WHATSAPP_NUMBER
if [ ! -z "$MSG91_WHATSAPP_NUMBER" ]; then
    set_secret "MSG91_WHATSAPP_NUMBER" "$MSG91_WHATSAPP_NUMBER" "MSG91 WhatsApp number"
fi

# ============================================
# 4. AWS SES SMTP CONFIGURATION (Fallback)
# ============================================
echo "📧 4. AWS SES SMTP Configuration (Fallback)"
echo "-------------------------------------------"

read -p "Enter SMTP_HOST (e.g., email-smtp.us-east-1.amazonaws.com): " SMTP_HOST
set_secret "SMTP_HOST" "$SMTP_HOST" "AWS SES SMTP host"

read -p "Enter SMTP_PORT (default: 587): " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}
set_secret "SMTP_PORT" "$SMTP_PORT" "AWS SES SMTP port"

read -p "Enter SMTP_SECURE (true/false, default: false): " SMTP_SECURE
SMTP_SECURE=${SMTP_SECURE:-false}
set_secret "SMTP_SECURE" "$SMTP_SECURE" "AWS SES SMTP secure flag"

read -p "Enter SMTP_USERNAME (AWS IAM Access Key): " SMTP_USERNAME
set_secret "SMTP_USERNAME" "$SMTP_USERNAME" "AWS SES SMTP username"

read -p "Enter SMTP_PASSWORD (AWS IAM Secret Key): " SMTP_PASSWORD
set_secret "SMTP_PASSWORD" "$SMTP_PASSWORD" "AWS SES SMTP password"

read -p "Enter SMTP_FROM_EMAIL (e.g., noreply@yourdomain.com): " SMTP_FROM_EMAIL
set_secret "SMTP_FROM_EMAIL" "$SMTP_FROM_EMAIL" "AWS SES from email"

read -p "Enter SMTP_FROM_NAME (e.g., Field Force CRM): " SMTP_FROM_NAME
set_secret "SMTP_FROM_NAME" "$SMTP_FROM_NAME" "AWS SES from name"

# ============================================
# 5. RESEND SMTP CONFIGURATION (Alternative)
# ============================================
echo "✉️  5. Resend SMTP Configuration (Alternative)"
echo "---------------------------------------------"

read -p "Set up Resend SMTP? (y/n, default: n): " SETUP_RESEND
SETUP_RESEND=${SETUP_RESEND:-n}

if [ "$SETUP_RESEND" = "y" ] || [ "$SETUP_RESEND" = "Y" ]; then
    RESEND_SMTP_HOST="smtp.resend.com"
    set_secret "RESEND_SMTP_HOST" "$RESEND_SMTP_HOST" "Resend SMTP host"

    RESEND_SMTP_PORT="465"
    set_secret "RESEND_SMTP_PORT" "$RESEND_SMTP_PORT" "Resend SMTP port"

    RESEND_SMTP_SECURE="true"
    set_secret "RESEND_SMTP_SECURE" "$RESEND_SMTP_SECURE" "Resend SMTP secure flag"

    RESEND_SMTP_USERNAME="resend"
    set_secret "RESEND_SMTP_USERNAME" "$RESEND_SMTP_USERNAME" "Resend SMTP username"

    read -p "Enter RESEND_SMTP_PASSWORD (API key): " RESEND_SMTP_PASSWORD
    set_secret "RESEND_SMTP_PASSWORD" "$RESEND_SMTP_PASSWORD" "Resend SMTP password"

    read -p "Enter RESEND_FROM_EMAIL (e.g., noreply@yourdomain.com): " RESEND_FROM_EMAIL
    set_secret "RESEND_FROM_EMAIL" "$RESEND_FROM_EMAIL" "Resend from email"

    read -p "Enter RESEND_FROM_NAME (e.g., Field Force CRM): " RESEND_FROM_NAME
    set_secret "RESEND_FROM_NAME" "$RESEND_FROM_NAME" "Resend from name"
else
    echo -e "${YELLOW}ℹ️  Skipping Resend SMTP configuration${NC}"
    echo ""
fi

# ============================================
# 6. OPTIONAL: MSG91 OTP WIDGET CREDENTIALS
# ============================================
echo "🔑 6. MSG91 OTP Widget Configuration (Optional)"
echo "-----------------------------------------------"

read -p "Set up MSG91 OTP Widget credentials? (y/n, default: y): " SETUP_WIDGET
SETUP_WIDGET=${SETUP_WIDGET:-y}

if [ "$SETUP_WIDGET" = "y" ] || [ "$SETUP_WIDGET" = "Y" ]; then
    read -p "Enter MSG91_WIDGET_ID: " MSG91_WIDGET_ID
    set_secret "MSG91_WIDGET_ID" "$MSG91_WIDGET_ID" "MSG91 OTP Widget ID"

    read -p "Enter MSG91_TOKEN_AUTH: " MSG91_TOKEN_AUTH
    set_secret "MSG91_TOKEN_AUTH" "$MSG91_TOKEN_AUTH" "MSG91 OTP Widget Token"
else
    echo -e "${YELLOW}ℹ️  Skipping MSG91 Widget configuration${NC}"
    echo ""
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Production Secrets Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "📋 Secrets configured:"
echo "  • Database: DATABASE_URL"
echo "  • JWT: JWT_SECRET"
echo "  • MSG91: AUTH_KEY, API_KEY, EMAIL_*, SENDER_ID"
echo "  • AWS SES: SMTP_*"
if [ "$SETUP_RESEND" = "y" ] || [ "$SETUP_RESEND" = "Y" ]; then
    echo "  • Resend: RESEND_*"
fi
if [ "$SETUP_WIDGET" = "y" ] || [ "$SETUP_WIDGET" = "Y" ]; then
    echo "  • MSG91 Widget: WIDGET_ID, TOKEN_AUTH"
fi
echo ""
echo "📝 Next Steps:"
echo "  1. Update wrangler.toml with non-secret vars (API_VERSION, etc.)"
echo "  2. Test deployment: wrangler deploy --dry-run"
echo "  3. Deploy to production: wrangler deploy"
echo "  4. Verify secrets: wrangler secret list"
echo ""
echo "🔒 Security Notes:"
echo "  • Secrets are encrypted by Cloudflare"
echo "  • Never commit .dev.vars to Git"
echo "  • Rotate secrets regularly"
echo "  • Use different secrets for staging/production"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"

#!/bin/bash

# GitHub Secrets Setup Script
# This script helps you set up GitHub secrets for Azure deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed. Please install it first:"
    echo "https://cli.github.com/"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    print_error "Please login to GitHub CLI first:"
    echo "gh auth login"
    exit 1
fi

print_header "GitHub Secrets Setup for Azure Deployment"

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
print_status "Setting up secrets for repository: $REPO"

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_value=""
    
    echo ""
    print_status "Setting up: $secret_name"
    echo "Description: $secret_description"
    
    if [[ $secret_name == *"PASSWORD"* ]] || [[ $secret_name == *"SECRET"* ]] || [[ $secret_name == *"KEY"* ]]; then
        read -s -p "Enter value (hidden): " secret_value
        echo ""
    else
        read -p "Enter value: " secret_value
    fi
    
    if [[ -n "$secret_value" ]]; then
        gh secret set "$secret_name" --body "$secret_value"
        print_status "✅ $secret_name set successfully"
    else
        print_warning "⚠️  Skipped $secret_name (empty value)"
    fi
}

# Generate random secrets function
generate_secret() {
    openssl rand -hex 32
}

print_warning "This script will help you set up GitHub secrets for Azure deployment."
print_warning "You can skip any secret by pressing Enter without a value."
echo ""

# Azure VM Configuration
print_header "Azure VM Configuration"
set_secret "AZURE_VM_IP" "Public IP address of your Azure VM"
set_secret "AZURE_VM_USER" "Username for SSH access to Azure VM (e.g., azureuser)"

echo ""
print_status "For SSH_PRIVATE_KEY, you need your private key content."
print_warning "Make sure to include the full key including headers:"
print_warning "-----BEGIN OPENSSH PRIVATE KEY-----"
print_warning "...key content..."
print_warning "-----END OPENSSH PRIVATE KEY-----"
set_secret "SSH_PRIVATE_KEY" "SSH private key for accessing Azure VM"

# Docker Registry Configuration
print_header "Docker Registry Configuration"
set_secret "DOCKER_REGISTRY" "Docker registry URL (e.g., docker.io for Docker Hub)"
set_secret "DOCKER_USERNAME" "Docker registry username"
set_secret "DOCKER_PASSWORD" "Docker registry password or access token"

# JWT Configuration
print_header "JWT Configuration"
echo ""
print_status "Generating random JWT secrets..."
JWT_ACCESS=$(generate_secret)
JWT_REFRESH=$(generate_secret)

gh secret set "JWT_ACCESS_TOKEN" --body "$JWT_ACCESS"
gh secret set "JWT_REFRESH_TOKEN" --body "$JWT_REFRESH"
print_status "✅ JWT secrets generated and set"

# Database Configuration
print_header "Database Configuration"
set_secret "MONGO_ROOT_USER" "MongoDB root username (e.g., admin)"
set_secret "MONGO_ROOT_PASSWORD" "MongoDB root password"
set_secret "MONGO_APP_PASSWORD" "MongoDB application user password"

echo ""
print_status "Generating random Redis password..."
REDIS_PASS=$(generate_secret)
gh secret set "REDIS_PASSWORD" --body "$REDIS_PASS"
print_status "✅ Redis password generated and set"

# Email Configuration
print_header "Email Configuration (SMTP)"
set_secret "SMTP_HOST" "SMTP server host (e.g., smtp.gmail.com)"
set_secret "SMTP_PORT" "SMTP server port (e.g., 587)"
set_secret "SMTP_MAIL" "SMTP username/email"
set_secret "SMTP_PASSWORD" "SMTP password or app password"

# Cloudinary Configuration
print_header "Cloudinary Configuration"
set_secret "CLOUDINARY_NAME" "Cloudinary cloud name"
set_secret "CLOUDINARY_API_KEY" "Cloudinary API key"
set_secret "CLOUDINARY_SECRET_KEY" "Cloudinary secret key"

# Stripe Configuration
print_header "Stripe Configuration"
print_warning "Use test keys for development, live keys for production"
set_secret "STRIPE_SECRET_KEY" "Stripe secret key (sk_test_... or sk_live_...)"
set_secret "STRIPE_PUBLISHABLE_KEY" "Stripe publishable key (pk_test_... or pk_live_...)"

print_header "Setup Complete!"
print_status "All GitHub secrets have been configured."
print_warning "Next steps:"
echo "1. Update .env.production with your domain and other production values"
echo "2. Update nginx/nginx.conf with your domain name"
echo "3. Set up your Azure VM using the azure-setup.sh script"
echo "4. Configure DNS for your domain"
echo "5. Push to GitHub to trigger deployment"
echo ""
print_status "To view all secrets: gh secret list"
print_status "To update a secret: gh secret set SECRET_NAME"

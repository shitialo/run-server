#!/bin/bash

# Production Environment Checker
# Validates that all required configurations are in place for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✅]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️ ]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

ERRORS=0
WARNINGS=0

check_file() {
    local file=$1
    local description=$2
    
    if [[ -f "$file" ]]; then
        print_status "$description exists"
    else
        print_error "$description missing: $file"
        ((ERRORS++))
    fi
}

check_env_var() {
    local var_name=$1
    local file=$2
    local description=$3
    
    if grep -q "^$var_name=" "$file" 2>/dev/null && ! grep -q "^$var_name=.*your-.*" "$file" 2>/dev/null; then
        print_status "$description configured"
    else
        print_error "$description not configured in $file"
        ((ERRORS++))
    fi
}

check_placeholder() {
    local file=$1
    local placeholder=$2
    local description=$3
    
    if grep -q "$placeholder" "$file" 2>/dev/null; then
        print_warning "$description still contains placeholder: $placeholder"
        ((WARNINGS++))
    else
        print_status "$description configured"
    fi
}

print_header "Production Deployment Readiness Check"

# Check required files
print_header "Required Files"
check_file "Dockerfile.production" "Production Dockerfile"
check_file "docker-compose.production.yml" "Production Docker Compose"
check_file ".env.production" "Production environment file"
check_file "nginx/nginx.conf" "Nginx configuration"
check_file ".github/workflows/deploy-azure.yml" "GitHub Actions workflow"

# Check environment variables
if [[ -f ".env.production" ]]; then
    print_header "Environment Variables"
    check_env_var "MONGODB_URI" ".env.production" "MongoDB URI"
    check_env_var "JWT_ACCESS_TOKEN" ".env.production" "JWT Access Token"
    check_env_var "JWT_REFRESH_TOKEN" ".env.production" "JWT Refresh Token"
    check_env_var "SMTP_HOST" ".env.production" "SMTP Host"
    check_env_var "CLOUDINARY_NAME" ".env.production" "Cloudinary Name"
    check_env_var "STRIPE_SECRET_KEY" ".env.production" "Stripe Secret Key"
    
    # Check for placeholder values
    check_placeholder ".env.production" "your-frontend-domain.com" "Frontend domain"
    check_placeholder ".env.production" "\${" "Environment variable substitution"
fi

# Check nginx configuration
if [[ -f "nginx/nginx.conf" ]]; then
    print_header "Nginx Configuration"
    check_placeholder "nginx/nginx.conf" "your-domain.com" "Domain name in Nginx config"
    
    if [[ -d "nginx/ssl" ]]; then
        print_status "SSL directory exists"
        if [[ -f "nginx/ssl/cert.pem" && -f "nginx/ssl/key.pem" ]]; then
            print_status "SSL certificates present"
        else
            print_warning "SSL certificates not found (will need Let's Encrypt setup)"
            ((WARNINGS++))
        fi
    else
        print_warning "SSL directory not created"
        ((WARNINGS++))
    fi
fi

# Check GitHub workflow
if [[ -f ".github/workflows/deploy-azure.yml" ]]; then
    print_header "GitHub Actions"
    
    # Check if workflow file has required secrets
    required_secrets=("AZURE_VM_IP" "AZURE_VM_USER" "SSH_PRIVATE_KEY" "DOCKER_REGISTRY" "DOCKER_USERNAME" "DOCKER_PASSWORD")
    
    for secret in "${required_secrets[@]}"; do
        if grep -q "$secret" ".github/workflows/deploy-azure.yml"; then
            print_status "Workflow references $secret"
        else
            print_error "Workflow missing reference to $secret"
            ((ERRORS++))
        fi
    done
fi

# Check Docker files
print_header "Docker Configuration"

if [[ -f "Dockerfile.production" ]]; then
    if grep -q "FROM node:" "Dockerfile.production"; then
        print_status "Production Dockerfile uses Node.js base image"
    else
        print_error "Production Dockerfile missing Node.js base image"
        ((ERRORS++))
    fi
    
    if grep -q "HEALTHCHECK" "Dockerfile.production"; then
        print_status "Production Dockerfile includes health check"
    else
        print_warning "Production Dockerfile missing health check"
        ((WARNINGS++))
    fi
fi

if [[ -f "docker-compose.production.yml" ]]; then
    if grep -q "image.*latest" "docker-compose.production.yml"; then
        print_status "Production compose uses container registry image"
    else
        print_error "Production compose not configured for registry image"
        ((ERRORS++))
    fi
    
    if grep -q "restart: unless-stopped" "docker-compose.production.yml"; then
        print_status "Production compose configured for auto-restart"
    else
        print_warning "Production compose missing restart policy"
        ((WARNINGS++))
    fi
fi

# Check scripts
print_header "Deployment Scripts"
check_file "scripts/azure-setup.sh" "Azure VM setup script"
check_file "scripts/setup-github-secrets.sh" "GitHub secrets setup script"

if [[ -f "scripts/azure-setup.sh" ]]; then
    if [[ -x "scripts/azure-setup.sh" ]]; then
        print_status "Azure setup script is executable"
    else
        print_warning "Azure setup script not executable (run: chmod +x scripts/azure-setup.sh)"
        ((WARNINGS++))
    fi
fi

# Security checks
print_header "Security Configuration"

if [[ -f ".env.production" ]]; then
    if grep -q "NODE_ENV=production" ".env.production"; then
        print_status "NODE_ENV set to production"
    else
        print_error "NODE_ENV not set to production"
        ((ERRORS++))
    fi
    
    # Check for development values in production
    if grep -q "localhost" ".env.production"; then
        print_warning "Production config contains localhost references"
        ((WARNINGS++))
    fi
    
    if grep -q "test@" ".env.production"; then
        print_warning "Production config contains test email addresses"
        ((WARNINGS++))
    fi
fi

# Final summary
print_header "Summary"

if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
    print_status "🎉 All checks passed! Ready for production deployment."
elif [[ $ERRORS -eq 0 ]]; then
    print_warning "⚠️  $WARNINGS warnings found. Review and fix before deployment."
    echo ""
    echo "You can proceed with deployment, but consider addressing the warnings."
else
    print_error "❌ $ERRORS errors and $WARNINGS warnings found."
    echo ""
    echo "Please fix all errors before attempting deployment."
    exit 1
fi

echo ""
print_header "Next Steps"
echo "1. Fix any errors or warnings listed above"
echo "2. Set up your Azure VM using: ./scripts/azure-setup.sh"
echo "3. Configure GitHub secrets using: ./scripts/setup-github-secrets.sh"
echo "4. Update domain names in nginx/nginx.conf"
echo "5. Push to GitHub to trigger deployment"
echo "6. Configure SSL certificates on the server"
echo ""
print_status "Good luck with your deployment! 🚀"

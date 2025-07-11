#!/bin/bash

# Azure VM Setup Script for Ciphemic Backend
# Run this script on your Azure Linux VM to prepare for deployment

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_header "Azure VM Setup for Ciphemic Backend"

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nginx

# Install Docker
print_status "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose (standalone)
print_status "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall
print_status "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp  # Backend API (can be removed after nginx setup)
sudo ufw --force enable

# Configure fail2ban
print_status "Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /opt/ciphemic-backend
sudo chown $USER:$USER /opt/ciphemic-backend
cd /opt/ciphemic-backend

# Clone repository (you'll need to update this URL)
print_status "Cloning repository..."
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Create necessary directories
mkdir -p uploads logs backups nginx/ssl

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/ciphemic-backend > /dev/null <<EOF
/opt/ciphemic-backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f /opt/ciphemic-backend/docker-compose.production.yml restart ciphemic-backend-prod
    endscript
}
EOF

# Create systemd service for auto-start
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/ciphemic-backend.service > /dev/null <<EOF
[Unit]
Description=Ciphemic Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/ciphemic-backend
ExecStart=/usr/local/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.production.yml down
TimeoutStartSec=0
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable ciphemic-backend.service

# Create backup script
print_status "Creating backup script..."
tee /opt/ciphemic-backend/scripts/backup.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/ciphemic-backend/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ciphemic-backup-$DATE.gz"

mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose -f /opt/ciphemic-backend/docker-compose.production.yml exec -T mongodb mongodump --db ciphemic-tech --gzip --archive > "$BACKUP_DIR/$BACKUP_FILE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "ciphemic-backup-*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /opt/ciphemic-backend/scripts/backup.sh

# Set up daily backup cron job
print_status "Setting up daily backup..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/ciphemic-backend/scripts/backup.sh") | crontab -

# Create monitoring script
print_status "Creating monitoring script..."
tee /opt/ciphemic-backend/scripts/monitor.sh > /dev/null <<'EOF'
#!/bin/bash
cd /opt/ciphemic-backend

# Check if containers are running
if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo "Some containers are down. Restarting..."
    docker-compose -f docker-compose.production.yml up -d
fi

# Check API health
if ! curl -f http://localhost:8000/api/test > /dev/null 2>&1; then
    echo "API health check failed. Restarting backend..."
    docker-compose -f docker-compose.production.yml restart ciphemic-backend-prod
fi
EOF

chmod +x /opt/ciphemic-backend/scripts/monitor.sh

# Set up monitoring cron job (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/ciphemic-backend/scripts/monitor.sh") | crontab -

print_header "Setup Complete!"
print_status "Azure VM is now configured for Ciphemic Backend deployment"
print_warning "Next steps:"
echo "1. Update the repository URL in this script"
echo "2. Configure your GitHub secrets:"
echo "   - AZURE_VM_IP: Your VM's public IP"
echo "   - AZURE_VM_USER: Your VM username"
echo "   - SSH_PRIVATE_KEY: Your SSH private key"
echo "   - DOCKER_REGISTRY: Your Docker registry URL"
echo "   - DOCKER_USERNAME: Your Docker registry username"
echo "   - DOCKER_PASSWORD: Your Docker registry password"
echo "3. Update .env.production with your actual values"
echo "4. Configure SSL certificates in nginx/ssl/"
echo "5. Update nginx.conf with your domain name"
echo "6. Push to GitHub to trigger deployment"
echo ""
print_status "Reboot recommended to ensure all changes take effect"
print_warning "Run 'newgrp docker' or logout/login to use Docker without sudo"

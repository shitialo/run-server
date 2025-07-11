# 🚀 Azure Deployment Guide

Complete guide to deploy Ciphemic Backend to Microsoft Azure Linux VM using GitHub Actions.

## 📋 Prerequisites

- Azure subscription
- GitHub repository
- Docker Hub account (or Azure Container Registry)
- Domain name (optional, for SSL)

## 🔧 Azure VM Setup

### 1. Create Azure Linux VM

```bash
# Using Azure CLI
az vm create \
  --resource-group myResourceGroup \
  --name ciphemic-vm \
  --image Ubuntu2204 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --size Standard_B2s \
  --public-ip-sku Standard \
  --storage-sku Premium_LRS
```

**Recommended VM Sizes:**
- **Development**: Standard_B1s (1 vCPU, 1GB RAM)
- **Production**: Standard_B2s (2 vCPU, 4GB RAM)
- **High Traffic**: Standard_D2s_v3 (2 vCPU, 8GB RAM)

### 2. Configure Network Security Group

```bash
# Allow HTTP, HTTPS, SSH, and API ports
az network nsg rule create \
  --resource-group myResourceGroup \
  --nsg-name ciphemic-vmNSG \
  --name AllowHTTP \
  --protocol tcp \
  --priority 1000 \
  --destination-port-range 80

az network nsg rule create \
  --resource-group myResourceGroup \
  --nsg-name ciphemic-vmNSG \
  --name AllowHTTPS \
  --protocol tcp \
  --priority 1001 \
  --destination-port-range 443
```

### 3. Connect and Setup VM

```bash
# SSH into your VM
ssh azureuser@YOUR_VM_PUBLIC_IP

# Download and run setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/ciphemic-tech-server-main/scripts/azure-setup.sh
chmod +x azure-setup.sh
./azure-setup.sh
```

## 🔐 GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets:
```
AZURE_VM_IP=your.vm.public.ip
AZURE_VM_USER=azureuser
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...your private key content...
-----END OPENSSH PRIVATE KEY-----

DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password

# Environment Variables
JWT_ACCESS_TOKEN=your-jwt-access-token-secret
JWT_REFRESH_TOKEN=your-jwt-refresh-token-secret
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your-secure-mongo-password
MONGO_APP_PASSWORD=your-app-mongo-password
REDIS_PASSWORD=your-redis-password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Cloudinary
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_SECRET_KEY=your-cloudinary-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_your-live-stripe-secret
STRIPE_PUBLISHABLE_KEY=pk_live_your-live-stripe-publishable
```

## 🌐 Domain and SSL Setup

### 1. Configure Domain DNS
Point your domain to your Azure VM's public IP:
```
A record: @ → YOUR_VM_PUBLIC_IP
A record: www → YOUR_VM_PUBLIC_IP
```

### 2. Generate SSL Certificate (Let's Encrypt)

```bash
# SSH into your VM
ssh azureuser@YOUR_VM_PUBLIC_IP

# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Update nginx configuration
sudo nano /opt/ciphemic-backend/nginx/nginx.conf
# Replace "your-domain.com" with your actual domain
```

### 3. Auto-renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 Deployment Process

### 1. Update Configuration Files

**Update `.env.production`:**
```bash
# Replace placeholder values with actual production values
ORIGIN=https://your-frontend-domain.com
BASE_URL=https://your-frontend-domain.com
```

**Update `nginx/nginx.conf`:**
```bash
# Replace "your-domain.com" with your actual domain
server_name your-actual-domain.com www.your-actual-domain.com;
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Configure production deployment"
git push origin main
```

### 3. Monitor Deployment
- Check GitHub Actions tab for deployment status
- SSH into VM to check container status:
```bash
cd /opt/ciphemic-backend
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# API health
curl https://your-domain.com/health

# Container status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f ciphemic-backend-prod
```

### Backup Management
```bash
# Manual backup
/opt/ciphemic-backend/scripts/backup.sh

# List backups
ls -la /opt/ciphemic-backend/backups/

# Restore from backup
docker-compose -f docker-compose.production.yml exec -T mongodb mongorestore --gzip --archive < backup-file.gz
```

### Performance Monitoring
```bash
# System resources
htop

# Docker stats
docker stats

# Disk usage
df -h
du -sh /opt/ciphemic-backend/*
```

## 🔧 Troubleshooting

### Common Issues:

1. **Deployment fails**: Check GitHub Actions logs
2. **Containers won't start**: Check `docker-compose logs`
3. **SSL issues**: Verify domain DNS and certificate
4. **Database connection**: Check MongoDB container and credentials
5. **High memory usage**: Consider upgrading VM size

### Useful Commands:
```bash
# Restart all services
docker-compose -f docker-compose.production.yml restart

# Update to latest image
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Clean up old images
docker image prune -f

# View system logs
sudo journalctl -u ciphemic-backend.service -f
```

## 💰 Cost Optimization

### Azure VM Cost Tips:
- Use **B-series** VMs for variable workloads
- Enable **auto-shutdown** during off-hours
- Use **Azure Reserved Instances** for long-term savings
- Monitor usage with **Azure Cost Management**

### Resource Limits:
The production compose file includes resource limits to prevent overconsumption:
- Backend: 1GB RAM, 0.5 CPU
- MongoDB: 2GB RAM, 1 CPU  
- Redis: 512MB RAM, 0.25 CPU
- Nginx: 256MB RAM, 0.25 CPU

## 🔄 CI/CD Pipeline Features

- **Automated builds** on push to main
- **Docker image caching** for faster builds
- **Zero-downtime deployment** with health checks
- **Automatic rollback** on deployment failure
- **Security scanning** of Docker images
- **Slack/email notifications** (configurable)

Your backend is now ready for production deployment on Azure! 🎉

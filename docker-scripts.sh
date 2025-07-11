#!/bin/bash

# Docker Management Scripts for Ciphemic Backend
# Make this file executable: chmod +x docker-scripts.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Setup environment file
setup_env() {
    print_header "Setting up Environment File"
    
    if [ ! -f .env ]; then
        if [ -f .env.docker ]; then
            cp .env.docker .env
            print_status "Copied .env.docker to .env"
            print_warning "Please update .env with your actual credentials!"
        else
            print_error ".env.docker template not found!"
            exit 1
        fi
    else
        print_status ".env file already exists"
    fi
}

# Build and start services
start_services() {
    print_header "Starting Ciphemic Backend Services"
    
    setup_env
    
    print_status "Building and starting services..."
    docker-compose up -d --build
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    print_status "Checking service health..."
    docker-compose ps
}

# Start with admin interfaces
start_with_admin() {
    print_header "Starting Services with Admin Interfaces"
    
    setup_env
    
    print_status "Building and starting all services including admin interfaces..."
    docker-compose --profile admin up -d --build
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    print_status "Services started! Access points:"
    echo "  - Backend API: http://localhost:8000"
    echo "  - MongoDB Admin: http://localhost:8081"
    echo "  - Redis Admin: http://localhost:8082"
}

# Stop services
stop_services() {
    print_header "Stopping Ciphemic Backend Services"
    
    docker-compose down
    print_status "Services stopped"
}

# Restart services
restart_services() {
    print_header "Restarting Ciphemic Backend Services"
    
    stop_services
    start_services
}

# View logs
view_logs() {
    print_header "Viewing Service Logs"
    
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

# Clean up everything
cleanup() {
    print_header "Cleaning Up Docker Resources"
    
    print_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --rmi all
        docker system prune -f
        print_status "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Show service status
status() {
    print_header "Service Status"
    
    docker-compose ps
    echo
    
    print_status "Container resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Database backup
backup_db() {
    print_header "Creating Database Backup"
    
    BACKUP_DIR="./backups"
    BACKUP_FILE="ciphemic-backup-$(date +%Y%m%d_%H%M%S).gz"
    
    mkdir -p "$BACKUP_DIR"
    
    print_status "Creating backup: $BACKUP_FILE"
    docker-compose exec -T mongodb mongodump --db ciphemic-tech --gzip --archive > "$BACKUP_DIR/$BACKUP_FILE"
    
    print_status "Backup created: $BACKUP_DIR/$BACKUP_FILE"
}

# Show help
show_help() {
    echo "Ciphemic Backend Docker Management Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  start       Start all services"
    echo "  start-admin Start services with admin interfaces"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs [service]  View logs (optionally for specific service)"
    echo "  status      Show service status"
    echo "  backup      Create database backup"
    echo "  cleanup     Remove all containers, volumes, and images"
    echo "  help        Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs ciphemic-backend"
    echo "  $0 status"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        start)
            start_services
            ;;
        start-admin)
            start_with_admin
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            view_logs "$2"
            ;;
        status)
            status
            ;;
        backup)
            backup_db
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"

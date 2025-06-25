
#!/bin/bash

# MikroTik Manager - Main Setup Script
# Orchestrates the complete setup process

set -e  # Exit on any error

echo "🚀 MikroTik Manager - Complete Setup Starting..."
echo "================================================"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source utilities
source "$SCRIPT_DIR/scripts/utils.sh"

# Check root permissions
check_root

# System setup
source "$SCRIPT_DIR/scripts/system-setup.sh"
setup_system_packages

# Cleanup existing processes
cleanup_pm2

# Kill processes on our target ports aggressively
print_status "Aggressively clearing target ports..."
kill_port_processes 3001
kill_port_processes 8080

# Backend setup and start
source "$SCRIPT_DIR/scripts/backend-setup.sh"
setup_backend
start_backend

# Frontend setup and start
source "$SCRIPT_DIR/scripts/frontend-setup.sh"
setup_frontend
start_frontend

# Configure firewall
configure_firewall

# Final health checks and status
echo ""
echo "================================================"
print_success "🎉 MikroTik Manager Setup Complete!"
echo "================================================"

source "$SCRIPT_DIR/scripts/health-check.sh"
show_status

# Test services
if test_services; then
    show_final_info
else
    print_error "Some services failed health checks. Please check the logs."
    exit 1
fi

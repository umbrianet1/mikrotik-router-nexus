
#!/bin/bash

# MikroTik Manager - System Setup Script
# Handles system packages and dependencies installation

set -e
source "$(dirname "$0")/utils.sh"

setup_system_packages() {
    print_status "Setting up system packages and dependencies..."
    
    # Update system
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y

    # Install Node.js 20 if not present
    if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
        print_status "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        print_success "Node.js $(node -v) already installed"
    fi

    # Install build tools
    print_status "Installing build tools..."
    sudo apt-get install -y build-essential python3 lsof psmisc

    # Install pm2 globally if not present
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing pm2 process manager..."
        sudo npm install -g pm2
    else
        print_success "pm2 already installed"
    fi

    # Install serve globally for frontend hosting
    if ! command -v serve &> /dev/null; then
        print_status "Installing serve for frontend hosting..."
        sudo npm install -g serve
    else
        print_success "serve already installed"
    fi
    
    print_success "System packages setup completed"
}

# Run setup if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    setup_system_packages
fi

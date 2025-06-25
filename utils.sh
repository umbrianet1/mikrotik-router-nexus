
#!/bin/bash

# MikroTik Manager - Utility Functions
# Common functions used across setup scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kill any processes using our ports (more aggressive approach)
kill_port_processes() {
    local port=$1
    print_status "Aggressively clearing port $port..."
    
    # Kill all processes using the port
    sudo lsof -ti:$port | xargs -r sudo kill -9 2>/dev/null || true
    sudo fuser -k $port/tcp 2>/dev/null || true
    
    # Wait and check again
    sleep 3
    local remaining=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$remaining" ]; then
        print_warning "Still found processes on port $port, killing with extreme prejudice..."
        sudo kill -9 $remaining 2>/dev/null || true
        sleep 2
    fi
    
    # Also kill by process name patterns
    sudo pkill -f "mikrotik-api.js" 2>/dev/null || true
    sudo pkill -f "node.*3001" 2>/dev/null || true
    sudo pkill -f "serve.*8080" 2>/dev/null || true
    sleep 2
}

# Check if running as root for system packages
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is fine for system setup."
    fi
}

# Complete PM2 cleanup
cleanup_pm2() {
    print_status "Complete PM2 cleanup..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    pm2 flush 2>/dev/null || true
    sleep 3
}

# Configure firewall if ufw is active
configure_firewall() {
    if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
        print_status "Configuring firewall..."
        sudo ufw allow 3001/tcp
        sudo ufw allow 8080/tcp
        print_success "Firewall configured for ports 3001 and 8080"
    fi
}

# Export functions for use in other scripts
export -f print_status print_success print_warning print_error
export -f kill_port_processes check_root cleanup_pm2 configure_firewall

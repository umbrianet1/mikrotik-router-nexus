
#!/bin/bash

# MikroTik Manager - Complete Setup and Start Script for Ubuntu
# This script sets up and starts both frontend and backend

set -e  # Exit on any error

echo "🚀 MikroTik Manager - Complete Setup Starting..."
echo "================================================"

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

# Check if running as root for system packages
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is fine for system setup."
    fi
}

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
sudo apt-get install -y build-essential python3

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 process manager..."
    sudo npm install -g pm2
else
    print_success "PM2 already installed"
fi

# Install serve globally for frontend hosting
if ! command -v serve &> /dev/null; then
    print_status "Installing serve for frontend hosting..."
    sudo npm install -g serve
else
    print_success "serve already installed"
fi

# Backend Setup
print_status "Setting up backend server..."
cd server

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install

# Test backend dependencies
print_status "Testing backend dependencies..."
node -e "
try {
  const routeros = require('node-routeros');
  console.log('✅ node-routeros installed successfully');
} catch(e) {
  console.log('❌ node-routeros installation failed:', e.message);
  process.exit(1);
}

try {
  const ssh2 = require('ssh2');
  console.log('✅ ssh2 installed successfully');
} catch(e) {
  console.log('❌ ssh2 installation failed:', e.message);
  process.exit(1);
}
"

# Start backend with PM2
print_status "Starting backend server with PM2..."
pm2 delete mikrotik-backend 2>/dev/null || true
pm2 start mikrotik-api.js --name mikrotik-backend --watch --ignore-watch="node_modules"
pm2 save

print_success "Backend server started on port 3001"

# Frontend Setup
print_status "Setting up frontend..."
cd ..

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install

# Build frontend
print_status "Building frontend for production..."
npm run build

# Start frontend with PM2
print_status "Starting frontend server with PM2..."
pm2 delete mikrotik-frontend 2>/dev/null || true
pm2 start serve --name mikrotik-frontend -- -s dist -l 8080

print_success "Frontend server started on port 8080"

# Configure firewall if ufw is active
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    print_status "Configuring firewall..."
    sudo ufw allow 3001/tcp
    sudo ufw allow 8080/tcp
    print_success "Firewall configured for ports 3001 and 8080"
fi

# Save PM2 configuration
pm2 save
pm2 startup | grep -E '^sudo' | sh 2>/dev/null || print_warning "PM2 startup configuration may need manual setup"

echo ""
echo "================================================"
print_success "🎉 MikroTik Manager Setup Complete!"
echo "================================================"
echo ""
echo "📊 Service Status:"
pm2 status

echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:     pm2 logs"
echo "   Restart all:   pm2 restart all"
echo "   Stop all:      pm2 stop all"
echo "   Service status: pm2 status"
echo ""
echo "🔥 Quick Test:"
echo "   curl http://localhost:3001/"
echo "   curl http://localhost:8080/"
echo ""

# Test both services
print_status "Testing services..."
sleep 3

if curl -s http://localhost:3001/ > /dev/null; then
    print_success "✅ Backend is responding"
else
    print_error "❌ Backend is not responding"
fi

if curl -s http://localhost:8080/ > /dev/null; then
    print_success "✅ Frontend is responding"
else
    print_error "❌ Frontend is not responding"
fi

echo ""
print_success "Setup completed! You can now access MikroTik Manager at http://localhost:8080"

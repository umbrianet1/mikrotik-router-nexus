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

# Kill any processes using our ports (more aggressive approach)
kill_port_processes() {
    local port=$1
    print_status "Checking for processes on port $port..."
    
    # Try multiple methods to kill processes on the port
    local processes=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$processes" ]; then
        print_warning "Found processes using port $port: $processes"
        kill -9 $processes 2>/dev/null || true
        sleep 2
        
        # Double check and try again if still running
        local remaining=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$remaining" ]; then
            print_warning "Still found processes, trying again: $remaining"
            sudo kill -9 $remaining 2>/dev/null || true
            sleep 2
        fi
    fi
    
    # Also try to kill by process name
    pkill -f "mikrotik-api.js" 2>/dev/null || true
    pkill -f "node.*3001" 2>/dev/null || true
    sleep 2
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
sudo apt-get install -y build-essential python3 lsof

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

# Stop any existing PM2 processes more thoroughly
print_status "Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 3

# Kill processes on our target ports
print_status "Clearing ports 3001 and 8080..."
kill_port_processes 3001
kill_port_processes 8080

# Make sure no PM2 processes are running
print_status "Ensuring clean PM2 state..."
pm2 flush 2>/dev/null || true

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

# Start backend with PM2 and better error handling
print_status "Starting backend server with PM2..."

# First ensure the working directory is correct
cd "$(dirname "$0")/server"

# Start with PM2
pm2 start mikrotik-api.js --name mikrotik-backend --watch --ignore-watch="node_modules" --max-restarts=3 --min-uptime="10s"

# Wait for backend to start
sleep 5

# Check if backend started successfully with more retries
backend_retries=0
while [ $backend_retries -lt 3 ]; do
    if pm2 list | grep -q "mikrotik-backend.*online"; then
        print_success "Backend server started successfully"
        break
    else
        backend_retries=$((backend_retries + 1))
        print_warning "Backend not ready yet, attempt $backend_retries/3..."
        if [ $backend_retries -eq 3 ]; then
            print_error "Backend failed to start after 3 attempts. Checking logs..."
            pm2 logs mikrotik-backend --lines 20
            print_status "Trying to start backend on alternative port..."
            pm2 restart mikrotik-backend
            sleep 5
        else
            sleep 3
        fi
    fi
done

# Return to project root for frontend
cd ..

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
pm2 start serve --name mikrotik-frontend -- -s dist -l 8080

# Wait for frontend to start
sleep 3

# Check if frontend started successfully
if ! pm2 list | grep -q "mikrotik-frontend.*online"; then
    print_error "Frontend failed to start. Checking logs..."
    pm2 logs mikrotik-frontend --lines 10
    exit 1
fi

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
    print_status "Backend logs:"
    pm2 logs mikrotik-backend --lines 5
fi

if curl -s http://localhost:8080/ > /dev/null; then
    print_success "✅ Frontend is responding"
else
    print_error "❌ Frontend is not responding"
    print_status "Frontend logs:"
    pm2 logs mikrotik-frontend --lines 5
fi

echo ""
print_success "Setup completed! You can now access MikroTik Manager at http://localhost:8080"
echo ""
print_status "🔍 If you encounter issues:"
echo "   - Check logs: pm2 logs"
echo "   - Restart services: pm2 restart all"
echo "   - Stop all: pm2 stop all && pm2 kill"
echo "   - Re-run this script: ./start.sh"

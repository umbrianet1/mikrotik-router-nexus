
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

# Complete PM2 cleanup
print_status "Complete PM2 cleanup..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
pm2 flush 2>/dev/null || true
sleep 3

# Kill processes on our target ports aggressively
print_status "Aggressively clearing target ports..."
kill_port_processes 3001
kill_port_processes 8080

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

# Start backend directly with node (not PM2)
print_status "Starting backend server directly with /usr/bin/node..."
cd "$(dirname "$0")/server"

# Start backend in background
nohup /usr/bin/node mikrotik-api.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid

print_status "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
print_status "Waiting for backend to initialize..."
sleep 8

# Check if backend is running and responding
backend_retries=0
backend_started=false
while [ $backend_retries -lt 5 ]; do
    if curl -s http://localhost:3001/ > /dev/null 2>&1; then
        print_success "✅ Backend server started successfully on port 3001"
        backend_started=true
        break
    else
        backend_retries=$((backend_retries + 1))
        print_warning "Backend not ready yet, attempt $backend_retries/5..."
        if [ $backend_retries -eq 5 ]; then
            print_error "Backend failed to start after 5 attempts. Checking logs..."
            tail -20 ../backend.log
            exit 1
        else
            sleep 3
        fi
    fi
done

if [ "$backend_started" = false ]; then
    print_error "Backend failed to start. Exiting..."
    exit 1
fi

# Return to project root for frontend
cd ..

# Frontend Setup
print_status "Setting up frontend..."

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install

# Build frontend
print_status "Building frontend for production..."
npm run build

# Stop any existing frontend PM2 process
pm2 stop mikrotik-frontend 2>/dev/null || true
pm2 delete mikrotik-frontend 2>/dev/null || true

# Start frontend with PM2
print_status "Starting frontend server with PM2..."
pm2 start serve --name mikrotik-frontend -- -s dist -l 8080

# Wait for frontend to start
sleep 5

# Check if frontend started successfully
frontend_retries=0
frontend_started=false
while [ $frontend_retries -lt 3 ]; do
    if pm2 list | grep -q "mikrotik-frontend.*online" && curl -s http://localhost:8080/ > /dev/null 2>&1; then
        print_success "✅ Frontend server started successfully on port 8080"
        frontend_started=true
        break
    else
        frontend_retries=$((frontend_retries + 1))
        print_warning "Frontend not ready yet, attempt $frontend_retries/3..."
        if [ $frontend_retries -eq 3 ]; then
            print_error "Frontend failed to start. Checking logs..."
            pm2 logs mikrotik-frontend --lines 10
            exit 1
        else
            sleep 3
        fi
    fi
done

if [ "$frontend_started" = false ]; then
    print_error "Frontend failed to start. Exiting..."
    exit 1
fi

# Configure firewall if ufw is active
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    print_status "Configuring firewall..."
    sudo ufw allow 3001/tcp
    sudo ufw allow 8080/tcp
    print_success "Firewall configured for ports 3001 and 8080"
fi

# Save PM2 configuration (only for frontend)
pm2 save
pm2 startup | grep -E '^sudo' | sh 2>/dev/null || print_warning "PM2 startup configuration may need manual setup"

echo ""
echo "================================================"
print_success "🎉 MikroTik Manager Setup Complete!"
echo "================================================"
echo ""
echo "📊 Service Status:"
echo "   Backend:  Running (PID: $BACKEND_PID) - Direct Node.js"
pm2 status

echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔧 Management Commands:"
echo "   Backend logs:  tail -f backend.log"
echo "   Stop backend:  kill \$(cat backend.pid)"
echo "   Frontend logs: pm2 logs mikrotik-frontend"
echo "   Frontend ctrl: pm2 restart/stop mikrotik-frontend"
echo ""

# Test both services
print_status "Final service test..."
sleep 2

if curl -s http://localhost:3001/ > /dev/null; then
    print_success "✅ Backend is responding correctly"
else
    print_error "❌ Backend is not responding"
    tail -10 backend.log
fi

if curl -s http://localhost:8080/ > /dev/null; then
    print_success "✅ Frontend is responding correctly"
else
    print_error "❌ Frontend is not responding"
    pm2 logs mikrotik-frontend --lines 5
fi

echo ""
print_success "Setup completed! You can now access MikroTik Manager at http://localhost:8080"
echo ""
print_status "📋 Process Information:"
echo "   Backend PID file: backend.pid"
echo "   Backend log file: backend.log"
echo "   Frontend managed by PM2"
echo ""
print_status "🔧 Troubleshooting:"
echo "   Backend logs: tail -f backend.log"
echo "   Kill backend: kill \$(cat backend.pid) 2>/dev/null || true"
echo "   Restart frontend: pm2 restart mikrotik-frontend"
echo "   Re-run setup: ./start.sh"



#!/bin/bash

# MikroTik Manager - Backend Setup Script
# Handles backend server setup and management

set -e
source "$(dirname "$0")/utils.sh"

setup_backend() {
    print_status "Setting up backend server..."
    cd "$(dirname "$0")/server"

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

    print_success "Backend dependencies installed and tested"
}

start_backend() {
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
}

# Run setup and start if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    setup_backend
    start_backend
fi

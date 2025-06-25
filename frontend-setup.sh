
#!/bin/bash

# MikroTik Manager - Frontend Setup Script
# Handles frontend build and deployment

set -e
source "$(dirname "$0")/utils.sh"

setup_frontend() {
    print_status "Setting up frontend..."
    cd "$(dirname "$0")"

    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    npm install

    # Build frontend
    print_status "Building frontend for production..."
    npm run build

    print_success "Frontend build completed"
}

start_frontend() {
    print_status "Starting frontend server..."
    cd "$(dirname "$0")"

    # Stop any existing frontend pm2 process
    pm2 stop mikrotik-frontend 2>/dev/null || true
    pm2 delete mikrotik-frontend 2>/dev/null || true

    # Start frontend with pm2
    print_status "Starting frontend server with pm2..."
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

    # Save pm2 configuration (only for frontend)
    pm2 save
    pm2 startup | grep -E '^sudo' | sh 2>/dev/null || print_warning "pm2 startup configuration may need manual setup"
}

# Run setup and start if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    setup_frontend
    start_frontend
fi

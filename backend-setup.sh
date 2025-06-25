
#!/bin/bash

# mikrotik manager - backend setup script
# handles backend server setup and management

set -e
source "$(dirname "$0")/utils.sh"

setup_backend() {
    print_status "setting up backend server..."
    cd "$(dirname "$0")/backend"

    # install backend dependencies
    print_status "installing backend dependencies..."
    npm install

    # test backend dependencies
    print_status "testing backend dependencies..."
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

    print_success "backend dependencies installed and tested"
}

start_backend() {
    print_status "starting backend server directly with /usr/bin/node..."
    cd "$(dirname "$0")/backend"

    # start backend in background
    nohup /usr/bin/node mikrotik-api.js > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid

    print_status "backend started with pid: $BACKEND_PID"

    # wait for backend to start
    print_status "waiting for backend to initialize..."
    sleep 8

    # check if backend is running and responding
    backend_retries=0
    backend_started=false
    while [ $backend_retries -lt 5 ]; do
        if curl -s http://localhost:3001/ > /dev/null 2>&1; then
            print_success "✅ backend server started successfully on port 3001"
            backend_started=true
            break
        else
            backend_retries=$((backend_retries + 1))
            print_warning "backend not ready yet, attempt $backend_retries/5..."
            if [ $backend_retries -eq 5 ]; then
                print_error "backend failed to start after 5 attempts. checking logs..."
                tail -20 ../backend.log
                exit 1
            else
                sleep 3
            fi
        fi
    done

    if [ "$backend_started" = false ]; then
        print_error "backend failed to start. exiting..."
        exit 1
    fi
}

# run setup and start if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    setup_backend
    start_backend
fi

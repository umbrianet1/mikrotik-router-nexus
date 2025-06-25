
#!/bin/bash

# MikroTik Manager - Health Check Script
# Tests services and validates functionality

set -e
source "$(dirname "$0")/utils.sh"

test_services() {
    print_status "Final service test..."
    sleep 2

    # Test backend
    if curl -s http://localhost:3001/ > /dev/null; then
        print_success "✅ Backend is responding correctly"
    else
        print_error "❌ Backend is not responding"
        tail -10 backend.log
        return 1
    fi

    # Test frontend
    if curl -s http://localhost:8080/ > /dev/null; then
        print_success "✅ Frontend is responding correctly"
    else
        print_error "❌ Frontend is not responding"
        pm2 logs mikrotik-frontend --lines 5
        return 1
    fi

    return 0
}

show_status() {
    echo ""
    echo "📊 Service Status:"
    echo "   Backend:  Running (PID: $(cat backend.pid 2>/dev/null || echo 'N/A')) - Direct Node.js"
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
}

show_final_info() {
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
}

# Run tests and show info if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    test_services
    show_status
    show_final_info
fi

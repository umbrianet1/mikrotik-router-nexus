
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
    echo "📊 Service status:"
    echo "   backend:  Running (pid: $(cat backend.pid 2>/dev/null || echo 'n/a')) - Direct Node.js"
    pm2 status

    echo ""
    echo "🌐 Access urls:"
    echo "   frontend: http://localhost:8080"
    echo "   backend:  http://localhost:3001"
    echo ""
    echo "🔧 Management commands:"
    echo "   backend logs:  tail -f backend.log"
    echo "   stop backend:  kill \$(cat backend.pid)"
    echo "   frontend logs: pm2 logs mikrotik-frontend"
    echo "   frontend ctrl: pm2 restart/stop mikrotik-frontend"
    echo ""
}

show_final_info() {
    echo ""
    print_success "Setup completed! You can now access mikrotik manager at http://localhost:8080"
    echo ""
    print_status "📋 Process information:"
    echo "   backend pid file: backend.pid"
    echo "   backend log file: backend.log"
    echo "   frontend managed by pm2"
    echo ""
    print_status "🔧 Troubleshooting:"
    echo "   backend logs: tail -f backend.log"
    echo "   kill backend: kill \$(cat backend.pid) 2>/dev/null || true"
    echo "   restart frontend: pm2 restart mikrotik-frontend"
    echo "   re-run setup: ./start.sh"
}

# Run tests and show info if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    test_services
    show_status
    show_final_info
fi

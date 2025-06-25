
#!/bin/bash

# MikroTik Manager Server Installation Script for Ubuntu 24

echo "Installing MikroTik Manager Server on Ubuntu 24..."

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools (needed for some native modules)
sudo apt-get install -y build-essential python3

# Install PM2 for process management
sudo npm install -g pm2

# Create directory structure
sudo mkdir -p /opt/mikrotik-manager/server
sudo mkdir -p /opt/mikrotik-manager/logs

# Copy server files
sudo cp -r * /opt/mikrotik-manager/server/

# Navigate to server directory
cd /opt/mikrotik-manager/server

# Install dependencies with verbose output
echo "Installing Node.js dependencies..."
sudo npm install --verbose

# Verify installation
echo "Verifying installation..."
node -e "
try {
  const routeros = require('node-routeros');
  console.log('✅ node-routeros installed successfully');
} catch(e) {
  console.log('❌ node-routeros installation failed:', e.message);
}

try {
  const ssh2 = require('ssh2');
  console.log('✅ ssh2 installed successfully');
} catch(e) {
  console.log('❌ ssh2 installation failed:', e.message);
}
"

# Create systemd service
sudo tee /etc/systemd/system/mikrotik-manager.service > /dev/null <<EOF
[Unit]
Description=MikroTik Manager API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/mikrotik-manager/server
ExecStart=/usr/bin/node mikrotik-api.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Stop any existing service
sudo systemctl stop mikrotik-manager 2>/dev/null || true

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mikrotik-manager
sudo systemctl start mikrotik-manager

# Wait a moment for service to start
sleep 3

# Configure firewall (if ufw is active)
if command -v ufw &> /dev/null; then
    sudo ufw allow 3001/tcp
    echo "Firewall configured to allow port 3001"
fi

# Check service status
echo ""
echo "Installation completed!"
echo "Server should be running on port 3001"
echo ""
echo "Service status:"
sudo systemctl status mikrotik-manager --no-pager

echo ""
echo "Testing server response:"
curl -s http://localhost:3001/ | head -10

echo ""
echo "Commands:"
echo "  Check status: sudo systemctl status mikrotik-manager"
echo "  View logs: sudo journalctl -u mikrotik-manager -f"
echo "  Restart: sudo systemctl restart mikrotik-manager"
echo "  Stop: sudo systemctl stop mikrotik-manager"
echo ""
echo "If you see dependency errors, run:"
echo "  cd /opt/mikrotik-manager/server && sudo npm install"

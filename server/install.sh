
#!/bin/bash

# mikrotik manager backend installation script for ubuntu 24

echo "installing mikrotik manager backend on ubuntu 24..."

# update system
sudo apt update
sudo apt upgrade -y

# install node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# install build tools (needed for some native modules)
sudo apt-get install -y build-essential python3

# install pm2 for process management
sudo npm install -g pm2

# create directory structure
sudo mkdir -p /opt/mikrotik-manager/backend
sudo mkdir -p /opt/mikrotik-manager/logs

# copy backend files
sudo cp -r * /opt/mikrotik-manager/backend/

# navigate to backend directory
cd /opt/mikrotik-manager/backend

# install dependencies with verbose output
echo "installing node.js dependencies..."
sudo npm install --verbose

# verify installation
echo "verifying installation..."
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

# create systemd service
sudo tee /etc/systemd/system/mikrotik-manager.service > /dev/null <<EOF
[Unit]
Description=mikrotik manager api backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/mikrotik-manager/backend
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

# stop any existing service
sudo systemctl stop mikrotik-manager 2>/dev/null || true

# enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mikrotik-manager
sudo systemctl start mikrotik-manager

# wait a moment for service to start
sleep 3

# configure firewall (if ufw is active)
if command -v ufw &> /dev/null; then
    sudo ufw allow 3001/tcp
    echo "firewall configured to allow port 3001"
fi

# check service status
echo ""
echo "installation completed!"
echo "backend should be running on port 3001"
echo ""
echo "service status:"
sudo systemctl status mikrotik-manager --no-pager

echo ""
echo "testing backend response:"
curl -s http://localhost:3001/ | head -10

echo ""
echo "commands:"
echo "  check status: sudo systemctl status mikrotik-manager"
echo "  view logs: sudo journalctl -u mikrotik-manager -f"
echo "  restart: sudo systemctl restart mikrotik-manager"
echo "  stop: sudo systemctl stop mikrotik-manager"
echo ""
echo "if you see dependency errors, run:"
echo "  cd /opt/mikrotik-manager/backend && sudo npm install"

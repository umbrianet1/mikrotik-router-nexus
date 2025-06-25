
#!/bin/bash

# MikroTik Manager Server Installation Script for Ubuntu 24

echo "Installing MikroTik Manager Server on Ubuntu 24..."

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create directory structure
mkdir -p /opt/mikrotik-manager/server
mkdir -p /opt/mikrotik-manager/logs

# Copy server files
cp -r * /opt/mikrotik-manager/server/

# Navigate to server directory
cd /opt/mikrotik-manager/server

# Install dependencies
npm install

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

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mikrotik-manager
sudo systemctl start mikrotik-manager

# Configure firewall (if ufw is active)
if command -v ufw &> /dev/null; then
    sudo ufw allow 3001/tcp
    echo "Firewall configured to allow port 3001"
fi

echo "Installation completed!"
echo "Server is running on port 3001"
echo "Check status: sudo systemctl status mikrotik-manager"
echo "View logs: sudo journalctl -u mikrotik-manager -f"


# MikroTik Manager - Centralized Router Management

A web application for centralized management of MikroTik routers with real API/SSH connectivity, supporting both RouterOS 6.x and 7.x.

## Features

### Real MikroTik Integration
- **API Connection**: Primary connection method via RouterOS API (port 8728)
- **SSH Fallback**: Automatic fallback to SSH connection (port 22)
- **Version Detection**: Automatic RouterOS version detection and compatibility handling
- **Multi-Router Support**: Manage multiple routers simultaneously

### Address List Management
- View and compare address lists across multiple routers
- Add/remove IP addresses from specific router lists
- Bulk synchronization between routers
- Visual diff highlighting for inconsistencies
- Support for both IPv4 and IPv6 addresses

### Backup Management
- Manual and scheduled backups
- Real backup file creation on routers
- Backup download and storage
- Retention policies and cleanup

### Command Center
- Execute RouterOS commands via API or SSH
- Command history and output logging
- Pre-defined command templates
- Support for both RouterOS 6.x and 7.x syntax

## Installation on Ubuntu 24

### Prerequisites
```bash
sudo apt update
sudo apt upgrade -y
```

### Backend Server Installation
```bash
cd server
chmod +x install.sh
sudo ./install.sh
```

This will:
- Install Node.js 20
- Install required dependencies
- Create system service
- Configure firewall
- Start the API server on port 3001

### Frontend Development Server
```bash
npm install
npm run dev
```

## Architecture

### Backend (Node.js API Server)
- **Express.js** REST API
- **node-routeros** for MikroTik API communication
- **ssh2** for SSH connections
- **CORS** enabled for frontend communication

### Frontend (React/Vite)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** icons

## API Endpoints

### Router Management
- `POST /api/routers/connect` - Connect to router
- `POST /api/routers/:id/disconnect` - Disconnect router

### Address Lists
- `GET /api/routers/:id/address-lists` - Get all address lists
- `POST /api/routers/:id/address-lists/:listName/addresses` - Add address
- `DELETE /api/routers/:id/address-lists/:listName/addresses/:address` - Remove address

### Backup Management
- `POST /api/routers/:id/backup` - Create backup

### Command Execution
- `POST /api/routers/:id/command` - Execute command

## Configuration

### Router Connection
Each router requires:
- **Name**: Display name
- **IP Address**: Router IP or hostname
- **Username**: RouterOS user with appropriate permissions
- **Password**: RouterOS user password

### Required RouterOS Permissions
For full functionality, the RouterOS user needs permissions for:
- `read`, `write` for address lists
- `read`, `write` for backup creation
- `read` for system information
- SSH access (if API fails)

## RouterOS Compatibility

### Version Support
- **RouterOS 6.x**: Full support via API and SSH
- **RouterOS 7.x**: Full support via API and SSH
- **Automatic Detection**: Version detection for optimal compatibility

### API vs SSH
- **API (Port 8728)**: Preferred method, faster and more reliable
- **SSH (Port 22)**: Fallback method, works when API is disabled
- **Automatic Fallback**: Tries API first, falls back to SSH if needed

## Security Considerations

### Network Security
- Change default API port if exposed to internet
- Use strong passwords for RouterOS users
- Consider VPN access for remote management
- Firewall rules to restrict access

### Application Security
- Credentials stored temporarily in memory only
- No persistent credential storage
- HTTPS recommended for production deployment
- Regular security updates

## Development

### Project Structure
```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── services/          # API service layer
│   └── pages/             # Application pages
├── server/                # Backend Node.js API
│   ├── mikrotik-api.js    # Main API server
│   ├── package.json       # Backend dependencies
│   └── install.sh         # Ubuntu installation script
└── README.md
```

### Adding New Features
1. Backend: Add new endpoints in `mikrotik-api.js`
2. Frontend: Add service methods in `mikrotikApi.ts`
3. UI: Create/update React components
4. Test with real MikroTik routers

## Troubleshooting

### Connection Issues
- Verify router IP and credentials
- Check if API service is enabled: `/ip service print`
- Ensure firewall allows connections to ports 8728 (API) and 22 (SSH)
- Test manual connection: `telnet router_ip 8728`

### Common RouterOS Commands
```bash
# Enable API service
/ip service enable api

# Check current services
/ip service print

# Create API user
/user add name=api password=yourpassword group=full

# Check firewall rules
/ip firewall filter print
```

### Service Management
```bash
# Check server status
sudo systemctl status mikrotik-manager

# View server logs
sudo journalctl -u mikrotik-manager -f

# Restart server
sudo systemctl restart mikrotik-manager
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test with real MikroTik routers
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check troubleshooting section
2. Review RouterOS documentation
3. Open GitHub issue with:
   - RouterOS version
   - Error messages
   - Network configuration

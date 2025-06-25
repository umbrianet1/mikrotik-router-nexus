
# MikroTik Manager - Centralized Router Management Platform

Una web application professionale per la gestione centralizzata di router MikroTik, con focus su Address List management e backup automatizzati.

## 🚀 Caratteristiche Principali

### 📊 Dashboard Centralizzata
- **Monitoraggio in tempo reale** dello stato dei router
- **Statistiche di rete** e health monitoring
- **Overview rapida** di tutti i dispositivi gestiti

### 🌐 Gestione Address List
- **CRUD completo** per le Address List su tutti i router
- **Sincronizzazione** automatica e manuale
- **Import/Export** in formato standard
- **Ricerca e filtri** avanzati
- **Gestione batch** su più router simultaneamente

### 💾 Sistema Backup
- **Backup automatici** con scheduler configurabile
- **Backup on-demand** per emergenze
- **Retention policy** personalizzabile
- **Compressione e crittografia** opzionale
- **Cronologia completa** dei backup

### 🔧 Command Center
- **Esecuzione comandi** via SSH e API MikroTik
- **Comandi rapidi** pre-configurati
- **Cronologia comandi** con output
- **Compatibilità** con tutte le versioni RouterOS

### 🔐 Sicurezza
- **Autenticazione locale** sicura
- **Gestione credenziali** crittografate
- **Audit logging** completo
- **2FA** opzionale
- **Session management** avanzato

### ⚙️ Configurazione Avanzata
- **Impostazioni sistema** modulari
- **Notifiche email/Slack** configurabili
- **Export/Import** configurazioni
- **Log levels** personalizzabili

## 🛠️ Stack Tecnologico

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **State Management**: React Query
- **Routing**: React Router
- **UI Components**: Radix UI primitives

## 📋 Requisiti di Sistema

### Ubuntu 24.04 LTS
```bash
# Aggiorna il sistema
sudo apt update && sudo apt upgrade -y

# Installa Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifica installazione
node --version  # dovrebbe essere v20.x.x
npm --version   # dovrebbe essere v10.x.x
```

### Dipendenze Aggiuntive
```bash
# Git per clonare il repository
sudo apt install git -y

# PM2 per process management (opzionale)
sudo npm install -g pm2

# Nginx per reverse proxy (opzionale)
sudo apt install nginx -y
```

## 🚀 Installazione e Deploy

### 1. Clone del Repository
```bash
# Clona il progetto
git clone <YOUR_REPOSITORY_URL>
cd mikrotik-manager

# Oppure scarica e estrai il codice sorgente
# se hai ricevuto un archivio ZIP
```

### 2. Installazione Dipendenze
```bash
# Installa le dipendenze npm
npm install

# Verifica che non ci siano vulnerabilità
npm audit
```

### 3. Configurazione Ambiente

Crea il file di configurazione ambiente:
```bash
# Copia il template di configurazione
cp .env.example .env

# Modifica le variabili di ambiente
nano .env
```

Esempio di configurazione `.env`:
```env
# App Configuration
VITE_APP_NAME="MikroTik Manager"
VITE_APP_VERSION="1.0.0"

# API Configuration
VITE_API_BASE_URL="http://localhost:3001"

# Security
VITE_SESSION_TIMEOUT=28800  # 8 ore in secondi
VITE_MAX_LOGIN_ATTEMPTS=3

# Features
VITE_ENABLE_BACKUP=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_2FA=false
```

### 4. Build per Produzione
```bash
# Genera la build ottimizzata
npm run build

# La cartella dist/ conterrà i file statici
ls -la dist/
```

### 5. Deploy con Server Web

#### Opzione A: Serve con Node.js
```bash
# Installa serve globalmente
sudo npm install -g serve

# Avvia l'applicazione sulla porta 3000
serve -s dist -l 3000

# Con PM2 per auto-restart
pm2 start "serve -s dist -l 3000" --name mikrotik-manager
pm2 save
pm2 startup
```

#### Opzione B: Nginx (Raccomandato)
```bash
# Copia i file nella directory web
sudo cp -r dist/* /var/www/html/mikrotik-manager/

# Configura Nginx
sudo nano /etc/nginx/sites-available/mikrotik-manager
```

Configurazione Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Sostituisci con il tuo dominio
    root /var/www/html/mikrotik-manager;
    index index.html;

    # Gestione delle Single Page Application
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache per asset statici
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compressione GZIP
    gzip on;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

Attiva la configurazione:
```bash
# Abilita il sito
sudo ln -s /etc/nginx/sites-available/mikrotik-manager /etc/nginx/sites-enabled/

# Testa la configurazione
sudo nginx -t

# Riavvia Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6. SSL/HTTPS con Let's Encrypt (Raccomandato)
```bash
# Installa Certbot
sudo apt install certbot python3-certbot-nginx -y

# Ottieni certificato SSL
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Aggiungi: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Configurazione Backend (Opzionale)

Per funzionalità avanzate, puoi integrare un backend Node.js:

### 1. Crea il Backend
```bash
mkdir mikrotik-backend
cd mikrotik-backend
npm init -y

# Installa dipendenze backend
npm install express cors dotenv
npm install ssh2 node-routeros-api
npm install bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

### 2. Backend di Base
```javascript
// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes di esempio
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
```

### 3. Avvia il Backend
```bash
# Sviluppo
npm run dev

# Produzione con PM2
pm2 start server.js --name mikrotik-backend
```

## 🔒 Sicurezza in Produzione

### 1. Firewall Configuration
```bash
# Abilita UFW
sudo ufw enable

# Consenti solo porte necessarie
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# Blocca tutto il resto
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### 2. Nginx Security Headers
Aggiungi al blocco server in Nginx:
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### 3. Backup e Monitoring
```bash
# Script di backup automatico
nano /opt/mikrotik-backup.sh
```

```bash
#!/bin/bash
# Backup script per MikroTik Manager
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mikrotik-manager"

mkdir -p $BACKUP_DIR

# Backup configurazioni
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /var/www/html/mikrotik-manager/

# Mantieni solo gli ultimi 30 backup
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +30 -delete

echo "Backup completato: $DATE"
```

```bash
# Rendi eseguibile
sudo chmod +x /opt/mikrotik-backup.sh

# Aggiungi a crontab
sudo crontab -e
# Aggiungi: 0 2 * * * /opt/mikrotik-backup.sh
```

## 📚 Utilizzo dell'Applicazione

### 1. Primo Accesso
1. Naviga su `http://your-domain.com`
2. La dashboard mostra lo stato iniziale
3. Aggiungi il primo router da "Router Management"

### 2. Aggiunta Router
1. Vai su **Router Management**
2. Clicca **"Add Router"**
3. Inserisci:
   - Nome router
   - Indirizzo IP
   - Credenziali SSH/API
   - Porte (default: SSH 22, API 8728)
4. Testa la connessione

### 3. Gestione Address List
1. Vai su **Address Lists**
2. Crea nuove liste o sincronizza esistenti
3. Import/Export in formato testo
4. Sincronizza su tutti i router

### 4. Backup Management
1. Configura lo **scheduler automatico**
2. Esegui **backup manuali** quando necessario
3. Scarica file di backup dalla cronologia

### 5. Command Center
1. Seleziona router target
2. Scegli metodo (SSH/API)
3. Esegui comandi RouterOS
4. Visualizza output e cronologia

## 🐛 Troubleshooting

### Problemi Comuni

#### 1. Errore "Permission Denied" su Ubuntu
```bash
# Controlla permessi directory
sudo chown -R www-data:www-data /var/www/html/mikrotik-manager
sudo chmod -R 755 /var/www/html/mikrotik-manager
```

#### 2. Nginx "502 Bad Gateway"
```bash
# Controlla stato Nginx
sudo systemctl status nginx

# Verifica log errori
sudo tail -f /var/log/nginx/error.log
```

#### 3. Errori di Connessione Router
- Verifica credenziali SSH/API
- Controlla firewall del router
- Testa connettività di rete
- Verifica versione RouterOS supportata

#### 4. Problemi di Build
```bash
# Pulisci cache npm
npm cache clean --force

# Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install
```

### Log di Sistema
```bash
# Log applicazione
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Log PM2 (se utilizzato)
pm2 logs mikrotik-manager
```

## 🔄 Aggiornamenti

### Aggiornamento Applicazione
```bash
# Backup configurazione corrente
cp -r dist dist.backup.$(date +%Y%m%d)

# Pull nuova versione
git pull origin main

# Reinstalla dipendenze
npm install

# Nuovo build
npm run build

# Deploy
sudo cp -r dist/* /var/www/html/mikrotik-manager/
sudo systemctl reload nginx
```

## 📄 Licenza

Questo progetto è ispirato ai seguenti progetti open source:
- [MikroTik-AddressList-Manager](https://github.com/uom42/MIkrotik-AddressList-Manager)
- [RouterFleet](https://github.com/eduardogsilva/routerfleet)

## 🤝 Contributi

Per contribuire al progetto:
1. Fai fork del repository
2. Crea un branch feature
3. Implementa le modifiche
4. Aggiungi test se necessario
5. Invia una pull request

## 📞 Supporto

Per supporto tecnico o segnalazione bug:
- Crea una issue nel repository
- Controlla la documentazione
- Verifica i log di sistema

---

**MikroTik Manager** - Gestione professionale centralizzata per la tua infrastruttura di rete MikroTik.

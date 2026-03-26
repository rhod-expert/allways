# Useful Commands

## Backend
```bash
# Start/restart API with PM2
pm2 restart allways-api
pm2 start /var/www/html/allways/backend/server.js --name allways-api

# View API logs
pm2 logs allways-api
pm2 logs allways-api --lines 100

# Dev mode (auto-reload)
cd /var/www/html/allways/backend && npm run dev

# Install dependencies
cd /var/www/html/allways/backend && npm install

# Health check
curl http://localhost:3001/api/health
```

## Frontend
```bash
# Build production
cd /var/www/html/allways/frontend && npm run build

# Dev server (port 5173)
cd /var/www/html/allways/frontend && npm run dev

# Install dependencies
cd /var/www/html/allways/frontend && npm install
```

## Nginx
```bash
# Test and reload config
nginx -t && nginx -s reload

# Config file location
/var/www/html/allways/nginx/allways.conf
# Symlinked to: /etc/nginx/sites-enabled/allways.conf
```

## Oracle Database
```bash
# Test connection
sqlplus allways/Q1Kpvif9RTs4@WINT

# Query example
sqlplus allways/Q1Kpvif9RTs4@WINT <<< "SELECT COUNT(*) FROM ALLWAYS_PARTICIPANTES;"

# Run all migration scripts
cd /var/www/html/allways/database && sqlplus allways/Q1Kpvif9RTs4@WINT @run-all.sql
```

## PM2
```bash
pm2 status
pm2 monit
pm2 flush allways-api   # Clear logs
pm2 save                # Save process list
```

## Git
```bash
cd /var/www/html/allways && git status
git log --oneline -10
```

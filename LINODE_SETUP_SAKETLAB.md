# BharatViz Deployment on saketlab.in Linode Server

Complete setup guide for deploying BharatViz frontend and API on your existing Linode server.

## 📋 Current Setup

- **Frontend URL**: http://bharatviz.saketlab.in/
- **API URL**: http://bharatviz.saketlab.in/api/
- **Server**: Your existing Linode instance
- **User**: bharatviz (already created)

## 🎯 One-Time Server Setup

SSH into your Linode server as the bharatviz user.

### Step 1: Install Node.js 25.0 (if not already installed)

```bash
# Check if Node.js is installed
node --version

# If not v25.0, install Node.js 25.x
curl -fsSL https://deb.nodesource.com/setup_25.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v25.0.x
npm --version
```

### Step 2: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version

# Setup PM2 to start on boot
pm2 startup systemd

# Follow the command it outputs (copy-paste and run it)
# It will look like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u bharatviz --hp /home/bharatviz
```

### Step 3: Create Directory Structure

```bash
# Create application directory (if doesn't exist)
sudo mkdir -p /var/www/bharatviz
sudo chown -R bharatviz:bharatviz /var/www/bharatviz

# Clone repository
cd /var/www
git clone https://github.com/saketkc/bharatviz.git
cd bharatviz
```

### Step 4: Setup Frontend Directory

```bash
# Create frontend build directory
mkdir -p /var/www/bharatviz/frontend

# Note: GitHub Actions will deploy built files here
# The dist folder from the build will be copied to /var/www/bharatviz/frontend/
```

### Step 5: Install and Build Server

```bash
cd /var/www/bharatviz/server

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Create logs directory
mkdir -p logs
```

### Step 6: Start the API Server

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Verify it's running
pm2 status
# Should show: bharatviz-api | online | 2
```

### Step 7: Configure Nginx

Create a single nginx configuration that serves both frontend and API:

```bash
sudo nano /etc/nginx/sites-available/bharatviz
```

Add this content:

```nginx
# BharatViz - bharatviz.saketlab.in
# Serves frontend and API from same domain

upstream bharatviz_api {
    server localhost:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name bharatviz.saketlab.in;

    # Root directory for frontend files
    root /var/www/bharatviz/frontend;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Logging
    access_log /var/log/nginx/bharatviz-access.log;
    error_log /var/log/nginx/bharatviz-error.log;

    # API endpoints - serve from Node.js backend
    location /api/ {
        # CORS headers for API requests
        add_header Access-Control-Allow-Origin "http://bharatviz.saketlab.in" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;

        # CORS preflight
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "http://bharatviz.saketlab.in";
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        proxy_pass http://bharatviz_api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for map generation
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Large request body for CSV uploads
        client_max_body_size 10M;
    }

    # Health check endpoint (no CORS needed)
    location /health {
        proxy_pass http://bharatviz_api/health;
        access_log off;
    }

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # No cache for HTML files
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/javascript
        application/json
        application/xml
        text/css
        text/javascript
        text/plain
        text/xml;
}
```

#### Enable the configuration:

```bash
# Remove default if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Enable our site
sudo ln -s /etc/nginx/sites-available/bharatviz /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 8: Update DNS (on your domain registrar)

Add an A record for the bharatviz subdomain:

- **Type**: A
- **Name**: `bharatviz` (or `bharatviz.saketlab` depending on your registrar)
- **Value**: Your Linode server IP address
- **TTL**: 300 (5 minutes)

Wait a few minutes for DNS propagation.

### Step 9: Setup SSL (Optional but Recommended)

```bash
# Install Certbot if not already installed
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d bharatviz.saketlab.in

# Certbot will automatically:
# - Obtain certificate
# - Update Nginx config to redirect HTTP to HTTPS
# - Setup auto-renewal
```

### Step 10: Update Firewall (if UFW is enabled)

```bash
# Check if UFW is active
sudo ufw status

# If active, ensure these ports are allowed:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
```

## 🔑 GitHub Secrets Configuration

Go to your GitHub repository: **Settings → Secrets and variables → Actions**

Add these secrets:

### 1. LINODE_HOST
- **Value**: Your Linode server IP address
- Example: `123.45.67.89`

### 2. LINODE_USER
- **Value**: `bharatviz` (the user you created)

### 3. LINODE_SSH_KEY
- **Value**: Your private SSH key

Generate SSH key if you don't have one:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-bharatviz" -f ~/.ssh/bharatviz_deploy

# Add public key to Linode server
ssh-copy-id -i ~/.ssh/bharatviz_deploy.pub bharatviz@YOUR_LINODE_IP

# Test the connection
ssh -i ~/.ssh/bharatviz_deploy bharatviz@YOUR_LINODE_IP

# Copy private key for GitHub secret
cat ~/.ssh/bharatviz_deploy
# Copy the entire output (including -----BEGIN and -----END lines)
```

Paste the private key (entire content) into GitHub secret `LINODE_SSH_KEY`.

### 4. LINODE_PORT (Optional)
- **Value**: `22` (default SSH port)
- Only needed if using non-standard SSH port

## ✅ Verification Checklist

After setup, verify everything is working:

### 1. Check PM2 Status

```bash
pm2 status
```

Expected output:
```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┤
│ 0  │ bharatviz-api      │ cluster  │ 0    │ online    │ 0%       │
│ 1  │ bharatviz-api      │ cluster  │ 0    │ online    │ 0%       │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┘
```

### 2. Test API Locally

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### 3. Test API via Domain

```bash
# HTTP (before SSL)
curl http://bharatviz.saketlab.in/health

# HTTPS (after SSL)
curl https://bharatviz.saketlab.in/health
```

### 4. Test Map Generation

```bash
curl -X POST http://bharatviz.saketlab.in/api/v1/states/map \
  -H "Content-Type: application/json" \
  -d '{
    "data": [{"state": "Maharashtra", "value": 75.8}],
    "colorScale": "viridis",
    "formats": ["png"]
  }' | jq '.success'
```

Expected: `true`

### 5. Check Nginx Status

```bash
sudo systemctl status nginx
```

Expected: `active (running)`

### 6. Check Frontend

```bash
# Check if frontend files exist
ls -la /var/www/bharatviz/frontend/

# Visit in browser
# http://bharatviz.saketlab.in (should show the BharatViz app)
```

### 7. Check Logs

```bash
# PM2 logs
pm2 logs bharatviz-api --lines 20

# Nginx access logs
sudo tail -f /var/log/nginx/bharatviz-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/bharatviz-error.log
```

## 🚀 Deployment Process

After initial setup, deployments are **automatic**:

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Update"
   git push origin main
   ```

2. **GitHub Actions will**:
   - Build frontend → Deploy to `/var/www/bharatviz/frontend/`
   - Build backend → Deploy and restart PM2

3. **Monitor deployment**:
   - Go to GitHub repository → Actions tab
   - Watch the deployment progress

## 🔧 Manual Deployment (if needed)

```bash
# SSH into server
ssh bharatviz@YOUR_LINODE_IP

# Update code
cd /var/www/bharatviz
git pull origin main

# Deploy frontend
npm ci
npm run build
cp -r dist/* /var/www/bharatviz/frontend/

# Deploy backend
cd server
npm ci --production
npm run build
pm2 restart bharatviz-api

# Verify
pm2 status
pm2 logs bharatviz-api --lines 10
```

## 📊 Monitoring Commands

```bash
# PM2 process status
pm2 status

# Real-time logs
pm2 logs bharatviz-api

# Real-time monitoring
pm2 monit

# Memory usage
free -h

# Disk usage
df -h

# API health
curl http://localhost:3001/health

# Frontend check
curl -I http://bharatviz.saketlab.in/
```

## 🐛 Troubleshooting

### API not starting

```bash
# Check PM2 logs
pm2 logs bharatviz-api --err

# Restart
pm2 restart bharatviz-api

# If still failing, rebuild
cd /var/www/bharatviz/server
npm run build
pm2 restart bharatviz-api
```

### Nginx 502 Bad Gateway

```bash
# Check if API is running
pm2 status
curl http://localhost:3001/health

# Restart API
pm2 restart bharatviz-api

# Check Nginx logs
sudo tail -f /var/log/nginx/bharatviz-error.log
```

### Frontend not loading

```bash
# Check if files exist
ls -la /var/www/bharatviz/frontend/

# Check nginx config
sudo nginx -t

# Check permissions
sudo chown -R www-data:www-data /var/www/bharatviz/frontend/
sudo chmod -R 755 /var/www/bharatviz/frontend/
```

### CORS Errors

Check the `ALLOWED_ORIGINS` in `/var/www/bharatviz/server/.env.production`:

```bash
nano /var/www/bharatviz/server/.env.production
```

Should include:
```
ALLOWED_ORIGINS=http://bharatviz.saketlab.in,https://bharatviz.saketlab.in
```

After changes:
```bash
pm2 restart bharatviz-api
```

### Port Already in Use

```bash
# Find what's using port 3001
sudo lsof -i :3001

# Kill old process
pm2 delete bharatviz-api

# Start fresh
pm2 start /var/www/bharatviz/server/ecosystem.config.js --env production
pm2 save
```

## 📁 Directory Structure

```
/var/www/bharatviz/
├── frontend/              # Built frontend files (served by Nginx)
│   ├── index.html
│   ├── assets/
│   └── [other dist files]
├── server/                # API server
│   ├── dist/              # Compiled TypeScript
│   ├── logs/              # PM2 logs
│   ├── node_modules/
│   ├── ecosystem.config.js
│   ├── .env.production
│   └── deploy.sh
└── [other files from repo]
```

## 🌐 URLs

After complete setup:

- **Frontend**: http://bharatviz.saketlab.in (or https:// if SSL)
- **API**: http://bharatviz.saketlab.in/api/ (or https:// if SSL)
- **API Health**: http://bharatviz.saketlab.in/health
- **Map Generation**: http://bharatviz.saketlab.in/api/v1/states/map

## 🎉 Success Checklist

- [ ] Node.js 25.0+ installed
- [ ] PM2 installed and configured
- [ ] Repository cloned to `/var/www/bharatviz`
- [ ] Server dependencies installed
- [ ] Server built successfully
- [ ] PM2 running: `bharatviz-api | online | 2`
- [ ] Nginx configured for single domain with frontend + API
- [ ] DNS A record added for `bharatviz.saketlab.in`
- [ ] SSL certificate obtained (optional)
- [ ] GitHub secrets configured (4 secrets)
- [ ] Frontend accessible at bharatviz.saketlab.in
- [ ] API accessible at bharatviz.saketlab.in/api/
- [ ] Health check returns 200 OK
- [ ] Can generate map via API

---

**Need Help?**

Check logs:
- PM2: `pm2 logs bharatviz-api`
- Nginx: `sudo tail -f /var/log/nginx/bharatviz-error.log`

Test manually:
- Frontend: `curl -I http://bharatviz.saketlab.in/`
- API: `curl http://bharatviz.saketlab.in/health`
- PM2: `pm2 status`
#!/bin/bash
set -e

echo "=========================================="
echo "BharatViz Server Initial Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as bharatviz user
if [ "$USER" != "bharatviz" ]; then
    echo -e "${RED}Error: This script must be run as the bharatviz user${NC}"
    echo "Please SSH as: ssh bharatviz@YOUR_SERVER_IP"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 25.x..."
    curl -fsSL https://deb.nodesource.com/setup_25.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js found: $(node --version)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found even after Node.js installation!${NC}"
    exit 1
else
    echo -e "${GREEN}npm found: $(npm --version)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    sudo npm install -g pm2
    echo -e "${GREEN}PM2 installed: $(pm2 --version)${NC}"
else
    echo -e "${GREEN}PM2 already installed: $(pm2 --version)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Setting up PM2 startup...${NC}"
pm2 startup systemd | grep -o "sudo.*" | bash || echo "PM2 startup already configured"

echo ""
echo -e "${YELLOW}Step 5: Setting up directory structure...${NC}"
sudo mkdir -p /var/www/bharatviz
sudo chown -R bharatviz:bharatviz /var/www/bharatviz

echo ""
echo -e "${YELLOW}Step 6: Cloning repository...${NC}"
if [ -d "/var/www/bharatviz/.git" ]; then
    echo "Repository already exists. Updating..."
    cd /var/www/bharatviz
    git fetch origin
    git reset --hard origin/main
else
    echo "Cloning repository..."
    cd /var/www
    if [ -d "bharatviz" ]; then
        sudo rm -rf bharatviz
    fi
    git clone https://github.com/saketkc/bharatviz.git
    sudo chown -R bharatviz:bharatviz bharatviz
    cd bharatviz
fi

echo ""
echo -e "${YELLOW}Step 7: Installing and building server...${NC}"
cd /var/www/bharatviz/server
npm install
npm run build

echo ""
echo -e "${YELLOW}Step 8: Creating environment file...${NC}"
cat > /var/www/bharatviz/server/.env.production << EOF
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=http://bharatviz.saketlab.in,https://bharatviz.saketlab.in
EOF
echo -e "${GREEN}.env.production created${NC}"

echo ""
echo -e "${YELLOW}Step 9: Creating frontend directory...${NC}"
mkdir -p /var/www/bharatviz/frontend
chmod 755 /var/www/bharatviz/frontend

echo ""
echo -e "${YELLOW}Step 10: Starting server with PM2...${NC}"
cd /var/www/bharatviz/server
pm2 delete bharatviz-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo -e "${YELLOW}Step 11: Configuring PATH for non-interactive shells...${NC}"
grep -qxF 'export PATH="/usr/bin:/usr/local/bin:$PATH"' ~/.bashrc || echo 'export PATH="/usr/bin:/usr/local/bin:$PATH"' >> ~/.bashrc
grep -qxF 'export PATH="/usr/bin:/usr/local/bin:$PATH"' ~/.profile || echo 'export PATH="/usr/bin:/usr/local/bin:$PATH"' >> ~/.profile
source ~/.bashrc

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Verification:"
echo "-------------"

# Verify everything
echo -n "Node.js: "
node --version
echo -n "npm: "
npm --version
echo -n "PM2: "
pm2 --version
echo ""

echo "PM2 Status:"
pm2 status

echo ""
echo "Testing API health endpoint..."
sleep 2
curl -s http://localhost:3001/health || echo -e "${RED}Health check failed!${NC}"

echo ""
echo ""
echo "Next steps:"
echo "1. Configure nginx (see LINODE_SETUP_SAKETLAB.md Step 7)"
echo "2. Add DNS record for bharatviz.saketlab.in"
echo "3. Set up GitHub secrets"
echo "4. Push code to trigger automatic deployment"
echo ""
echo -e "${GREEN}Server is ready for GitHub Actions deployment!${NC}"

# Quick Fix for GitHub Actions Deployment

The directory `/var/www/bharatviz` already exists but is not a git repository. Here's how to fix it:

## Option 1: Convert Existing Directory to Git Repo (Recommended)

```bash
# SSH into server
ssh bharatviz@YOUR_LINODE_IP

# Navigate to the directory
cd /var/www/bharatviz

# Initialize as git repository
git init

# Add remote
git remote add origin https://github.com/saketkc/bharatviz.git

# Fetch all branches
git fetch origin

# Reset to match main branch
git reset --hard origin/main

# Set tracking branch
git branch --set-upstream-to=origin/main main

# Verify
git status
```

## Option 2: Remove and Clone Fresh

```bash
# SSH into server
ssh bharatviz@YOUR_LINODE_IP

# Remove existing directory
cd /var/www
sudo rm -rf bharatviz

# Clone fresh
git clone https://github.com/saketkc/bharatviz.git

# Fix permissions
sudo chown -R bharatviz:bharatviz bharatviz
```

## After Git Setup, Continue with Server Setup

```bash
# Navigate to server directory
cd /var/www/bharatviz/server

# Install dependencies
npm install

# Build
npm run build

# Create environment file
cat > .env.production << EOF
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=http://bharatviz.saketlab.in,https://bharatviz.saketlab.in
EOF

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Create frontend directory
mkdir -p /var/www/bharatviz/frontend

# Verify
pm2 status
curl http://localhost:3001/health
```

## Fix PATH for Non-Interactive SSH

This is critical for GitHub Actions:

```bash
# Add PATH to all shell configs
echo 'export PATH="/usr/bin:/usr/local/bin:$PATH"' >> ~/.bashrc
echo 'export PATH="/usr/bin:/usr/local/bin:$PATH"' >> ~/.profile

# Source them
source ~/.bashrc
source ~/.profile

# Test from local machine
logout
```

From your local machine:
```bash
ssh bharatviz@YOUR_LINODE_IP "node --version && npm --version && pm2 --version"
```

All three commands should return version numbers, not "command not found".

## Verify Complete Setup

Run this verification script on the server:

```bash
cd /var/www/bharatviz
git status                              # Should show "On branch main"
node --version                          # Should show v25.x.x
npm --version                           # Should show npm version
pm2 --version                           # Should show PM2 version
pm2 status bharatviz-api               # Should show "online"
curl http://localhost:3001/health      # Should return JSON
ls -la frontend/                       # Directory should exist
```

If all checks pass, GitHub Actions will work on the next push!

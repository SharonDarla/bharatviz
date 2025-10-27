# Minimal Setup Required (NVM Installation)

Since you're using NVM with Node.js already installed, you only need these few steps:

## Your Current Setup

- Node.js: `/home/bharatviz/.nvm/versions/node/v25.0.0/bin/node`
- npm: `/home/bharatviz/.nvm/versions/node/v25.0.0/bin/npm`
- pm2: `/home/bharatviz/.nvm/versions/node/v25.0.0/bin/pm2`

The GitHub Actions workflow has been configured to use NVM and these paths automatically.

## Setup Steps

### 1. Make Directory a Git Repository (One-Time)

```bash
# SSH into server
ssh bharatviz@YOUR_LINODE_IP

# Navigate to directory
cd /var/www/bharatviz

# Initialize git (if not already)
git init
git remote add origin https://github.com/saketkc/bharatviz.git
git fetch origin
git reset --hard origin/main
git branch -M main
git branch --set-upstream-to=origin/main main

# Verify
git status  # Should show "On branch main"
```

### 2. Build Server (One-Time)

```bash
cd /var/www/bharatviz/server

# Install dependencies
npm install

# Build
npm run build

# Create environment file
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=http://bharatviz.saketlab.in,https://bharatviz.saketlab.in
EOF

# Start with PM2 (if not already running)
pm2 start ecosystem.config.js --env production
pm2 save

# Verify
pm2 status
curl http://localhost:3001/health
```

### 3. Create Frontend Directory (One-Time)

```bash
mkdir -p /var/www/bharatviz/frontend
```

## That's It!

The GitHub Actions workflow now:
1. Loads NVM automatically
2. Sets the correct PATH to your Node.js v25.0.0 binaries
3. Uses npm and pm2 from your NVM installation

## How the Workflow Handles NVM

The deployment script includes:
```bash
# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Set Node.js binary path
NODE_BIN="$HOME/.nvm/versions/node/v25.0.0/bin"
export PATH="$NODE_BIN:$PATH"
```

This ensures all Node.js commands (npm, pm2) work correctly in non-interactive SSH sessions.

## Verify Setup

```bash
# Check git repository
cd /var/www/bharatviz
git status

# Check server is built
ls -la server/dist/

# Check PM2 is running
pm2 status bharatviz-api

# Check API responds
curl http://localhost:3001/health

# Check frontend directory exists
ls -la frontend/
```

## If You Upgrade Node.js Version

If you later upgrade to a newer version of Node.js (e.g., v25.1.0), update the path in the GitHub Actions workflow:

Edit `.github/workflows/firebase-hosting-merge.yml` and change:
```yaml
NODE_BIN="$HOME/.nvm/versions/node/v25.0.0/bin"
```

To your new version:
```yaml
NODE_BIN="$HOME/.nvm/versions/node/v25.1.0/bin"
```

Or use `nvm current` dynamically (see workflow file for details).

## Push and Deploy

Once setup is complete, commit and push:

```bash
git add .
git commit -m "Configure deployment for NVM installation"
git push origin main
```

GitHub Actions will now deploy automatically on every push to main!

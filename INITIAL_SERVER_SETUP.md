# Initial Server Setup - Run This First!

This is a **one-time setup** that must be completed before GitHub Actions can deploy automatically.

## Prerequisites

You should have:
- Linode server running Ubuntu/Debian
- `bharatviz` user created
- SSH access to the server

## Step 1: SSH into Server

```bash
ssh bharatviz@YOUR_LINODE_IP
```

## Step 2: Install Node.js 25.0

```bash
# Install Node.js 25.x
curl -fsSL https://deb.nodesource.com/setup_25.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v25.x.x
npm --version   # Should show 10.x.x or higher
```

**Important:** If you see "command not found", the PATH might not be updated. Try:
```bash
# Add to your PATH
echo 'export PATH="/usr/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify again
node --version
npm --version
```

## Step 3: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version

# Setup PM2 to start on system boot
pm2 startup systemd

# Run the command it outputs (it will look like this):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u bharatviz --hp /home/bharatviz
```

**If pm2 command not found:**
```bash
# Find where npm installs global packages
npm config get prefix
# Usually /usr or /usr/local

# Add to PATH
echo 'export PATH="/usr/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Try again
pm2 --version
```

## Step 4: Create Directory and Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/bharatviz
sudo chown -R bharatviz:bharatviz /var/www/bharatviz

# Navigate to directory
cd /var/www

# Clone repository
git clone https://github.com/saketkc/bharatviz.git
cd bharatviz

# Verify
pwd  # Should show /var/www/bharatviz
git status  # Should show branch main
```

## Step 5: Setup and Build Server

```bash
cd /var/www/bharatviz/server

# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify build
ls -la dist/  # Should show compiled JavaScript files
```

## Step 6: Create Environment File

```bash
# Create production environment file
nano /var/www/bharatviz/server/.env.production
```

Add this content:
```env
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=http://bharatviz.saketlab.in,https://bharatviz.saketlab.in
```

Save and exit (Ctrl+X, then Y, then Enter)

## Step 7: Start Server with PM2

```bash
cd /var/www/bharatviz/server

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Verify it's running
pm2 status
```

**Expected output:**
```
┌────┬────────────────┬─────────┬─────────┬──────────┐
│ id │ name           │ mode    │ status  │ cpu      │
├────┼────────────────┼─────────┼─────────┼──────────┤
│ 0  │ bharatviz-api  │ cluster │ online  │ 0%       │
│ 1  │ bharatviz-api  │ cluster │ online  │ 0%       │
└────┴────────────────┴─────────┴─────────┴──────────┘
```

## Step 8: Create Frontend Directory

```bash
# Create and set permissions
mkdir -p /var/www/bharatviz/frontend
chmod 755 /var/www/bharatviz/frontend
```

## Step 9: Test Everything Works

```bash
# Test API locally
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}

# Check PM2 logs
pm2 logs bharatviz-api --lines 20

# Verify directory structure
ls -la /var/www/bharatviz/
# Should show: frontend/, server/, src/, public/, etc.
```

## Step 10: Verify PATH for Non-Interactive Shells

GitHub Actions uses non-interactive SSH sessions, so we need to ensure PATH is set correctly:

```bash
# Add to .bashrc (for interactive sessions)
echo 'export PATH="/usr/bin:/usr/local/bin:$PATH"' >> ~/.bashrc

# Add to .profile (for non-interactive sessions)
echo 'export PATH="/usr/bin:/usr/local/bin:$PATH"' >> ~/.profile

# Reload
source ~/.bashrc
source ~/.profile

# Test non-interactive SSH
logout
```

From your local machine, test:
```bash
ssh bharatviz@YOUR_LINODE_IP "which node"
# Should output: /usr/bin/node

ssh bharatviz@YOUR_LINODE_IP "which npm"
# Should output: /usr/bin/npm

ssh bharatviz@YOUR_LINODE_IP "which pm2"
# Should output: /usr/bin/pm2
```

**If commands are not found in non-interactive mode:**

SSH back in and run:
```bash
# Create a .ssh/environment file
nano ~/.ssh/environment
```

Add:
```
PATH=/usr/bin:/usr/local/bin:/bin:/usr/sbin:/sbin
```

Then on the server, edit SSH config:
```bash
sudo nano /etc/ssh/sshd_config
```

Find and uncomment (or add):
```
PermitUserEnvironment yes
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

## Troubleshooting

### Issue: "npm: command not found"

```bash
# Find where node/npm are installed
which node
which npm

# If they're in /usr/bin:
ls -la /usr/bin/node
ls -la /usr/bin/npm

# Test with full path
/usr/bin/node --version
/usr/bin/npm --version

# Add to all shell configs
echo 'export PATH="/usr/bin:/usr/local/bin:$PATH"' | tee -a ~/.bashrc ~/.profile ~/.bash_profile
```

### Issue: "pm2: command not found"

```bash
# Reinstall PM2 globally
sudo npm install -g pm2

# Find where it's installed
which pm2
npm list -g pm2

# Usually in /usr/bin or /usr/local/bin
ls -la /usr/bin/pm2
ls -la /usr/local/bin/pm2
```

### Issue: "fatal: not a git repository"

```bash
# Verify you're in the right directory
cd /var/www/bharatviz
pwd
git status

# If not a git repo, clone it:
cd /var/www
sudo rm -rf bharatviz  # Remove if exists
git clone https://github.com/saketkc/bharatviz.git
sudo chown -R bharatviz:bharatviz bharatviz
```

## Final Verification Checklist

Run all these commands to verify everything is set up:

```bash
# 1. Node.js installed
node --version

# 2. npm installed
npm --version

# 3. PM2 installed
pm2 --version

# 4. Repository cloned
cd /var/www/bharatviz && git status

# 5. Server built
ls -la /var/www/bharatviz/server/dist/

# 6. PM2 running
pm2 status bharatviz-api

# 7. API responding
curl http://localhost:3001/health

# 8. Frontend directory exists
ls -la /var/www/bharatviz/frontend/

# 9. Correct permissions
stat /var/www/bharatviz | grep bharatviz

# 10. Non-interactive SSH works
logout
```

From local machine:
```bash
ssh bharatviz@YOUR_LINODE_IP "node --version && npm --version && pm2 --version"
```

If all commands succeed, your server is ready for GitHub Actions deployment!

## After Initial Setup

Once this is complete, GitHub Actions will:
- Pull latest code changes
- Build the frontend and deploy to `/var/www/bharatviz/frontend/`
- Build the server and restart PM2
- No manual intervention needed

You only need to run this setup **once**. Future deployments are automatic!

#!/usr/bin/env bash
# ==============================================================================
# PogX VPS Automated Setup & Deployment Script
# Target OS: Ubuntu 22.04 / 24.04 LTS (Spaceship Cloud VPS)
# ==============================================================================

set -e

echo "========================================================"
echo "⚡ Starting PogX Production Setup on Ubuntu VPS"
echo "========================================================"

# 1. Update system packages
echo "📦 Updating apt packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# 2. Install essential dependencies
echo "📦 Installing prerequisites (curl, git, ufw, nginx, certbot)..."
apt-get install -y curl git ufw nginx certbot python3-certbot-nginx

# 3. Install Node.js 20 LTS (NodeSource)
echo "📦 Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"

# 4. Prepare Application Directory
APP_DIR="/var/www/pogx"
echo "📂 Ensuring application directory exists at ${APP_DIR}..."
mkdir -p ${APP_DIR}

# If running from inside the uploaded project directory, copy files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "${PARENT_DIR}/server.js" ] && [ "${PARENT_DIR}" != "${APP_DIR}" ]; then
    echo "📋 Copying application files to ${APP_DIR}..."
    cp -r "${PARENT_DIR}"/* ${APP_DIR}/
    cp "${PARENT_DIR}/.env" ${APP_DIR}/.env 2>/dev/null || true
fi

cd ${APP_DIR}

# 5. Install NPM Dependencies
echo "📦 Installing npm dependencies in ${APP_DIR}..."
npm install --omit=dev

# 6. Configure Systemd Service
echo "⚙️ Configuring PogX systemd service..."
if [ -f "${APP_DIR}/deploy/pogx.service" ]; then
    cp "${APP_DIR}/deploy/pogx.service" /etc/systemd/system/pogx.service
    systemctl daemon-reload
    systemctl enable pogx
    systemctl restart pogx
    echo "✅ PogX service started and enabled."
fi

# 7. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx reverse proxy..."
if [ -f "${APP_DIR}/deploy/nginx.conf" ]; then
    cp "${APP_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/pogx
    ln -sf /etc/nginx/sites-available/pogx /etc/nginx/sites-enabled/pogx
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx
    echo "✅ Nginx reloaded successfully."
fi

# 8. Configure Firewall (UFW)
echo "🛡️ Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable || true
echo "✅ UFW firewall active."

echo "========================================================"
echo "🎉 PogX is successfully deployed and running!"
echo "========================================================"
echo ""
echo "Status check:"
echo "  systemctl status pogx"
echo "  curl http://localhost:3000/api/waitlist-count"
echo ""
echo "Next step for HTTPS / SSL (after pointing DNS to your VPS IP):"
echo "  certbot --nginx -d pogx.net -d www.pogx.net"
echo "========================================================"

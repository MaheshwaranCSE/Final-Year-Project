#!/usr/bin/env bash
# ==============================================================================
# BlockVault - Automated AWS EC2 Deployment Setup Script
# Works on Amazon Linux 2023, Amazon Linux 2, and Ubuntu 20.04/22.04/24.04
# Optimized for AWS Academy / Learner Lab t2.micro / t3.micro instances
# ==============================================================================
set -e

echo "============================================================"
echo " Starting BlockVault Setup on AWS EC2..."
echo "============================================================"

# 1. Allocate 2GB Swap (Prevents Out-Of-Memory errors on t2.micro / t3.micro)
if [ ! -f /swapfile ]; then
    echo "[1/6] Setting up 2GB swap memory..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap allocated successfully."
else
    echo "[1/6] Swap already exists."
fi

# 2. Detect OS and Install Dependencies (Java 17, Maven, Node.js, Nginx/Git)
echo "[2/6] Detecting OS package manager and installing runtimes..."
if command -v dnf &> /dev/null; then
    # Amazon Linux 2023 / Fedora / RHEL 9
    echo "Detected DNF (Amazon Linux 2023)..."
    sudo dnf install -y java-17-amazon-corretto-devel maven git tar nodejs npm nginx
elif command -v yum &> /dev/null; then
    # Amazon Linux 2 / CentOS 7
    echo "Detected YUM (Amazon Linux 2)..."
    sudo amazon-linux-extras enable corretto17 || true
    sudo yum install -y java-17-amazon-corretto-devel maven git tar nginx
    if ! command -v node &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    fi
elif command -v apt-get &> /dev/null; then
    # Ubuntu / Debian
    echo "Detected APT (Ubuntu/Debian)..."
    sudo apt-get update -y
    sudo apt-get install -y openjdk-17-jdk maven git tar curl nodejs npm nginx
fi

echo "Java version: $(java -version 2>&1 | head -n 1)"
echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# 3. Setup Project Directory
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"
echo "[3/6] Working directory: $APP_DIR"

# 4. Install Global Process Manager (pm2) and serve
echo "[4/6] Installing pm2 process manager..."
sudo npm install -g pm2 serve || npm install -g pm2 serve

# 5. Build and Start Backend (Spring Boot 3)
echo "[5/6] Building and launching Spring Boot backend..."
cd "$APP_DIR/backend"
mvn clean package -DskipTests

# Stop any running instances
pm2 delete blockvault-backend 2>/dev/null || true

# Run Spring Boot backend via PM2
pm2 start "java -jar target/backend-0.0.1-SNAPSHOT.jar" --name blockvault-backend

# 6. Build and Start Frontend (React + Vite)
echo "[6/6] Launching React frontend on port 3000..."
cd "$APP_DIR"
if [ ! -d "dist" ]; then
    npm install
    npm run build
fi

pm2 delete blockvault-frontend 2>/dev/null || true
pm2 start "serve -s dist -l 3000" --name blockvault-frontend

# Save PM2 state so it restarts on reboot
pm2 save

# 7. Configure Nginx Reverse Proxy for Port 80
echo "Configuring Nginx on port 80..."
sudo rm -f /etc/nginx/conf.d/default.conf
sudo tee /etc/nginx/conf.d/blockvault.conf > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Restart Nginx
sudo systemctl restart nginx || sudo service nginx restart || true

echo "============================================================"
echo " BlockVault Deployment Completed Successfully!"
echo "============================================================"
echo " Status of services:"
pm2 status
echo ""
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || curl -s ifconfig.me || echo "52.90.213.54")
echo " Access URLs:"
echo " - Standard Web (Port 80):    http://$PUBLIC_IP"
echo " - Direct Frontend (Port 3000): http://$PUBLIC_IP:3000"
echo " - Backend API (Port 8080):   http://$PUBLIC_IP:8080"
echo "============================================================"

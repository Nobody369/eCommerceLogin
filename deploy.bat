@echo off
REM EC2 Deployment Script for eCommerce Login App (Windows)
REM This script sets up Docker and deploys the application

echo 🚀 Starting EC2 deployment for eCommerce Login App...

REM Update system packages
echo 📦 Updating system packages...
sudo apt update

REM Install Docker & Docker Compose plugin
echo 🐳 Installing Docker & Docker Compose...
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu %lsb_release -cs% stable | sudo tee /etc/apt/sources.list.d/docker.list > nul
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

REM Add current user to docker group
echo 👤 Adding user to docker group...
sudo usermod -aG docker %USERNAME%
newgrp docker

REM Clone repository (if not already present)
if not exist "eCommerceLogin" (
    echo 📥 Cloning repository...
    git clone https://github.com/your-username/eCommerceLogin.git
)

cd eCommerceLogin

REM Setup environment variables
echo ⚙️ Setting up environment variables...
if not exist "api\.env" (
    copy api\env.example api\.env
    echo 📝 Please edit api\.env with your production values:
    echo    - Update DATABASE_URL for RDS (if using)
    echo    - Change JWT_SECRET to a secure value
    notepad api\.env
)

REM Build and start services
echo 🔨 Building and starting services...
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

REM Check service status
echo ✅ Checking service status...
docker compose -f docker-compose.prod.yml ps

echo 🎉 Deployment complete!
echo 🌐 Your application should be available at: http://[YOUR_EC2_PUBLIC_IP]
echo.
echo 📋 Useful commands:
echo    View logs: docker compose -f docker-compose.prod.yml logs -f
echo    Stop services: docker compose -f docker-compose.prod.yml down
echo    Restart services: docker compose -f docker-compose.prod.yml restart
echo    Update application: git pull ^&^& docker compose -f docker-compose.prod.yml up -d --build

pause

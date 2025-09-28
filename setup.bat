@echo off
echo 🚀 Setting up eCommerce Platform with Docker...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Build and start all services
echo 🐳 Building and starting all services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak >nul

REM Check if all services are running
echo 🔍 Checking service status...
docker-compose ps

REM Check if PostgreSQL is healthy
echo 🐘 Checking PostgreSQL health...
docker-compose exec postgres pg_isready -U ecommerce_user -d ecommerce_db
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not ready. Check logs with: docker-compose logs postgres
    pause
    exit /b 1
)

echo ✅ All services are running!

echo.
echo 🎉 Setup complete! Your application is now running:
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 🐘 PostgreSQL: localhost:5432
echo.
echo 📊 Useful commands:
echo   View logs: docker-compose logs [service]
echo   Stop services: docker-compose down
echo   Restart services: docker-compose restart
echo   Access API container: docker-compose exec api sh
echo   Access Web container: docker-compose exec web sh
echo   Access PostgreSQL: docker-compose exec postgres psql -U ecommerce_user -d ecommerce_db
echo.
echo 🔄 For development with hot reload, the services are already configured!
echo    Edit files in ./api or ./web and changes will be reflected automatically.
echo.
pause

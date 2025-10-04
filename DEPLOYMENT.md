# eCommerce Login App - Single EC2 Deployment

This project implements a single EC2 + Docker Compose deployment strategy for an eCommerce login application with Vue.js frontend and Node.js backend.

## Project Structure

```
eCommerceLogin/
├── api/                    # Backend (Node.js + Fastify + Prisma)
│   ├── Dockerfile         # Multi-stage production build
│   ├── env.example        # Environment variables template
│   └── src/
├── web/                   # Frontend (Vue.js + Vite)
│   ├── Dockerfile         # Nginx static file serving
│   ├── nginx.conf         # Nginx configuration
│   └── src/
├── docker-compose.yml     # Development compose
├── docker-compose.prod.yml # Production compose
├── deploy.sh             # Linux deployment script
└── deploy.bat            # Windows deployment script
```

## Architecture

- **Frontend**: Vue.js SPA served by Nginx on port 80
- **Backend**: Node.js API with Fastify on port 3001 (internal)
- **Database**: PostgreSQL (local container or RDS)
- **Networking**: Docker internal network with API proxy through Nginx

## Quick Start

### 1. EC2 Setup

Launch an EC2 instance (Ubuntu 20.04+) and open security group ports:
- Port 80 (HTTP)
- Port 443 (HTTPS, if using SSL)
- Port 22 (SSH)

### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-username/eCommerceLogin.git
cd eCommerceLogin

# Run deployment script
chmod +x deploy.sh
./deploy.sh
```

Or on Windows:
```cmd
deploy.bat
```

### 3. Configure Environment

Edit `api/.env` with your production values:
```env
DATABASE_URL="postgresql://username:password@your-rds-endpoint:5432/database_name?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
NODE_ENV=production
```

## Production Configuration

### Using RDS Database (Recommended)

1. Create RDS PostgreSQL instance
2. Update `DATABASE_URL` in `api/.env`
3. Remove `postgres` service from `docker-compose.prod.yml`
4. Update security groups to allow EC2 → RDS connection

### Using Local Database (PoC Only)

The default configuration includes a local PostgreSQL container. This is suitable for development/testing but not recommended for production.

## Docker Images

### Backend (`api/Dockerfile`)
- **Build Stage**: Node 20 Alpine with full dependencies
- **Runtime Stage**: Node 20 Alpine with production dependencies only
- **Features**: Multi-stage build, Prisma client generation, smaller image size

### Frontend (`web/Dockerfile`)
- **Build Stage**: Node 20 Alpine for building Vue.js app
- **Serve Stage**: Nginx Alpine for serving static files
- **Features**: Static file serving, SPA routing, API proxy

## Nginx Configuration

The `web/nginx.conf` provides:
- SPA routing fallback (`try_files $uri $uri/ /index.html`)
- API proxy to backend container (`/api/` → `http://backend:3001/`)
- Static asset caching
- Security headers

## Deployment Commands

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down

# Restart services
docker compose -f docker-compose.prod.yml restart

# Update application
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## HTTPS Setup (Optional)

For HTTPS with automatic SSL certificates, consider adding Caddy or Traefik:

### Caddy Example
```yaml
services:
  caddy:
    image: caddy:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - web
```

## Monitoring & Maintenance

### Health Checks
- Backend: Built-in health endpoint
- Database: PostgreSQL health check
- Frontend: Nginx status

### Logs
```bash
# Application logs
docker compose -f docker-compose.prod.yml logs -f

# Specific service logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f web
```

### Updates
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Database migrations (if needed)
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, unique secrets
3. **Database**: Use RDS with proper security groups
4. **HTTPS**: Enable SSL/TLS in production
5. **Firewall**: Restrict EC2 security group access
6. **Updates**: Keep Docker images and dependencies updated

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 80/443 are available
2. **Database Connection**: Check DATABASE_URL format
3. **Build Failures**: Verify Docker and Docker Compose installation
4. **Permission Issues**: Ensure user is in docker group

### Debug Commands
```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check container logs
docker compose -f docker-compose.prod.yml logs [service_name]

# Access container shell
docker compose -f docker-compose.prod.yml exec [service_name] sh

# Check network connectivity
docker compose -f docker-compose.prod.yml exec web ping backend
```

## Performance Optimization

1. **Image Size**: Multi-stage builds reduce image size
2. **Caching**: Nginx static asset caching
3. **CDN**: Consider CloudFront for static assets
4. **Database**: Use connection pooling
5. **Monitoring**: Add application monitoring (e.g., New Relic, DataDog)

## Cost Optimization

1. **Instance Size**: Start with t3.micro, scale as needed
2. **Storage**: Use EBS GP3 for better price/performance
3. **Database**: Use RDS with appropriate instance size
4. **Monitoring**: Set up billing alerts
5. **Auto-scaling**: Consider ECS for better scaling


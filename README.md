# eCommerce Login Platform

A simple eCommerce platform with Vue.js frontend and Fastify backend, featuring user authentication for both buyers and sellers.

## Project Structure

```
eCommerceLogin/
├── api/                 # Backend API (Fastify + Prisma)
│   ├── src/
│   │   └── server.js    # Main server file
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── package.json
│   └── env.example      # Environment variables template
├── web/                 # Frontend (Vue.js)
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── App.vue      # Main app component
│   │   └── main.js      # App entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml   # PostgreSQL Docker setup
├── init.sql            # Database initialization
├── setup.sh            # Linux/Mac setup script
└── setup.bat           # Windows setup script
```

## Features

- **User Authentication**: Login and registration for buyers and sellers
- **Role-based Access**: Different dashboards for buyers and sellers
- **JWT Authentication**: Secure token-based authentication
- **Database**: PostgreSQL with Docker and Prisma ORM
- **Modern Stack**: Vue 3 + Fastify + Prisma + PostgreSQL

## Prerequisites

- **Docker** and **Docker Compose** installed on your system
- **Node.js** (v16 or higher) and **npm** (for local development only)

## Quick Setup (Recommended)

### Option 1: Full Docker Setup (Recommended)

**For Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**For Windows:**
```cmd
setup.bat
```

This will start all services (PostgreSQL, API, and Web) in Docker containers with hot reload enabled.

### Option 2: Docker + Local Development

1. **Start PostgreSQL with Docker:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Backend Setup (API):**
   ```bash
   cd api
   cp env.example .env
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run dev
   ```

3. **Frontend Setup (Web):**
   ```bash
   cd web
   npm install
   npm run dev
   ```

### Option 3: Production Docker Setup

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## Database Configuration

The application uses PostgreSQL running in Docker with the following configuration:
- **Host**: localhost
- **Port**: 5432
- **Database**: ecommerce_db
- **Username**: ecommerce_user
- **Password**: ecommerce_password

## Running the Application

- **Backend API**: `http://localhost:3001`
- **Frontend**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5432`

## Docker Commands

### Development Commands

```bash
# Start all services (development)
docker-compose up --build -d

# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs api
docker-compose logs web
docker-compose logs postgres

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart api

# Access container shell
docker-compose exec api sh
docker-compose exec web sh
docker-compose exec postgres psql -U ecommerce_user -d ecommerce_db

# Rebuild and restart services
docker-compose up --build -d
```

### Production Commands

```bash
# Start production services
docker-compose -f docker-compose.prod.yml up --build -d

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

### Database Commands

```bash
# Reset database (removes all data)
docker-compose down -v
docker-compose up -d postgres

# Run Prisma migrations
docker-compose exec api npx prisma migrate dev

# Generate Prisma client
docker-compose exec api npx prisma generate

# Open Prisma Studio
docker-compose exec api npx prisma studio
```

## API Endpoints

- `GET /health` - Health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile (requires authentication)

## User Roles

- **BUYER**: Can browse products and make purchases
- **SELLER**: Can manage products and view sales

## Database Schema

The User model includes:
- `id`: Unique identifier
- `email`: User email (unique)
- `password`: Hashed password
- `firstName`: User's first name
- `lastName`: User's last name
- `role`: User role (BUYER or SELLER)
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

## Development

- Backend runs on port 3001
- Frontend runs on port 3000
- Frontend proxies API requests to backend
- Hot reload enabled for both frontend and backend

## Next Steps

This is a basic foundation. Future enhancements could include:
- Product management
- Shopping cart functionality
- Order processing
- Payment integration
- Enhanced UI/UX
- File uploads for product images
- Search and filtering
- Admin dashboard

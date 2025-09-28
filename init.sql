-- Initialize the ecommerce database
-- This file is automatically executed when the PostgreSQL container starts

-- Create the database if it doesn't exist (though it should already exist from POSTGRES_DB)
-- CREATE DATABASE IF NOT EXISTS ecommerce_db;

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;

-- Create any additional extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

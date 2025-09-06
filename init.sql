-- Initialize AfriLoyalty Database
-- This file is executed when the PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The database schema will be created by the application on first run
-- via the /api/init endpoint
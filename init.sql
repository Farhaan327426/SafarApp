-- SAFAR PostgreSQL Initial Database Dump & DDL Initialization

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    credentials_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    route_code VARCHAR(50) UNIQUE NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    base_fare NUMERIC(10, 2) NOT NULL,
    total_estimated_time_mins INTEGER,
    geometry GEOMETRY(LineString, 4326)
);

ALTER TABLE routes ADD COLUMN IF NOT EXISTS total_estimated_time_mins INTEGER;

CREATE INDEX IF NOT EXISTS routes_geom_idx ON routes USING GIST (geometry);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id INTEGER REFERENCES routes(id),
    user_id UUID REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ISSUED',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driver_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES users(id),
    vehicle_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS stops_location_idx ON stops USING GIST (location);

-- Hourly automated cleanup cron for stale driver sessions (>12 hours)
SELECT cron.schedule('cleanup_stale_sessions', '0 * * * *', $$
    UPDATE driver_sessions 
    SET status = 'EXPIRED', ended_at = NOW() 
    WHERE status = 'ACTIVE' 
    AND started_at < NOW() - INTERVAL '12 hours';
$$);

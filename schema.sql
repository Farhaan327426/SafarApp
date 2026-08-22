-- ================================================================================
-- SAFAR — MULTI-TENANT TRANSIT-TECH & COMPLIANCE PLATFORM SCHEMA
-- PostgreSQL 16 + PostGIS Extension DDL & Indexing Blueprint
-- Version: 3.1.0 (JKMT Routes, SRO Fare Engine, Non-Local Permits Update)
-- ================================================================================

-- ────────────────────────────────────────────────────────────────────────────────
-- PRE-TRANSACTION: ALTER TYPE ... ADD VALUE cannot run inside a transaction block
-- Must execute before BEGIN or in a separate migration step
-- ────────────────────────────────────────────────────────────────────────────────
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'ENFORCEMENT_OFFICER';

BEGIN;

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------------------
-- SCHEMA MIGRATION TRACKER
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INT PRIMARY KEY,
    description VARCHAR(256) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE schema_migrations IS 'Tracks schema migration history and applied DDL versions.';

-- --------------------------------------------------------------------------------
-- ENUM TYPE DEFINITIONS
-- --------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('COMMUTER', 'DRIVER', 'AUDITOR', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('CASH', 'UPI', 'CARD', 'WALLET', 'PASS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('PENDING_PAYMENT', 'CASH_EXPECTED', 'COMPLETED', 'DISPUTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE compliance_status_enum AS ENUM ('COMPLIANT', 'UNDER_INVESTIGATION', 'VIOLATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE severity_enum AS ENUM ('NONE', 'ROUNDING_VARIANCE', 'MINOR_OVERCHARGE', 'MAJOR_OVERCHARGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status_enum AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE sos_status_enum AS ENUM ('OPEN', 'DISPATCHED', 'RESOLVED', 'FALSE_ALARM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE permit_type_enum AS ENUM (
        'ALL_INDIA_TOURIST_PERMIT',
        'STATE_PERMIT',
        'CONTRACT_CARRIAGE_PERMIT',
        'STAGE_CARRIAGE_PERMIT'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE permit_verification_status_enum AS ENUM (
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'EXPIRED',
        'SUSPENDED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE home_state_enum AS ENUM (
        'PB', 'HP', 'DL', 'HR', 'UT', 'RJ', 'UP', 'CH', 'MP', 'MH', 'GA', 'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------------------------------
-- 1. MULTI-TENANT REGIONAL STATE ISOLATION
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_code VARCHAR(32) UNIQUE NOT NULL, -- e.g. 'jk_srta', 'hp_rtp'
    tenant_name VARCHAR(128) NOT NULL,
    state_name VARCHAR(64) NOT NULL,
    currency VARCHAR(8) DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tenants IS 'Multi-tenant regional state transport authority isolation table.';

-- --------------------------------------------------------------------------------
-- 2. USER ACCOUNTS & AUTHENTICATION (HARDENED WITH ACCOUNT LOCKOUT & RLS)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(16) UNIQUE NOT NULL,
    username VARCHAR(64) UNIQUE,
    full_name VARCHAR(128),
    role user_role_enum NOT NULL DEFAULT 'COMMUTER',
    password_hash VARCHAR(256),
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Master user accounts table spanning commuters, conductors, auditors, and admins.';

-- --------------------------------------------------------------------------------
-- 2b. USER SESSIONS & REFRESH TOKENS (TOKEN ROTATION SECURITY)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(256) NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(refresh_token_hash) WHERE revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

COMMENT ON TABLE sessions IS 'Stores SHA-256 session refresh token hashes and device metadata with automatic replay invalidation and revocation tracking.';

-- --------------------------------------------------------------------------------
-- 3. FARE SOURCES REGISTRY & RULES ENGINE (OFFICIAL J&K TRANSPORT DEPT)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fare_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    authority VARCHAR(128) NOT NULL,
    notification_number VARCHAR(128) NOT NULL UNIQUE,
    notification_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    source_url TEXT NULL,
    document_hash VARCHAR(64) NULL,
    reference_notes TEXT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED',
    is_active_sro BOOLEAN DEFAULT FALSE,
    sro_code VARCHAR(64) NULL,
    vehicle_category_scope VARCHAR(128) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE fare_sources IS 'Official State Regional Transport Authority J&K gazette and SRO notification registry with vehicle category scope.';

CREATE TABLE IF NOT EXISTS fare_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    source_id UUID REFERENCES fare_sources(id) ON DELETE SET NULL,
    vehicle_type VARCHAR(32) NOT NULL,
    vehicle_category VARCHAR(64) NOT NULL,
    fuel_type VARCHAR(32) DEFAULT 'PETROL_DIESEL',
    region VARCHAR(32) NOT NULL DEFAULT 'all',
    terrain VARCHAR(32) NOT NULL DEFAULT 'all',
    fare_basis VARCHAR(32) NOT NULL,
    distance_min_km NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    distance_max_km NUMERIC(6,2) NULL,
    first_km_rate NUMERIC(6,2) NULL,
    subsequent_km_rate NUMERIC(6,2) NULL,
    per_km_rate NUMERIC(6,2) NULL,
    flat_fare NUMERIC(6,2) NULL,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    boarding_stop_id UUID REFERENCES transit_stops(id) ON DELETE SET NULL,
    deboarding_stop_id UUID REFERENCES transit_stops(id) ON DELETE SET NULL,
    is_special_event BOOLEAN DEFAULT FALSE,
    event_name VARCHAR(64) NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ NULL,
    source_authority VARCHAR(128) NOT NULL,
    source_notification VARCHAR(128) NOT NULL,
    source_date DATE NULL,
    source_url TEXT NULL,
    source_reference VARCHAR(128) NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'REVIEW_REQUIRED' CHECK (verification_status IN ('VERIFIED', 'REVIEW_REQUIRED', 'DEACTIVATED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fare_rules_query ON fare_rules(vehicle_type, region, terrain, effective_from, verification_status);

COMMENT ON TABLE fare_rules IS 'Official J&K Transport Department passenger fare rules with source provenance tracking.';

-- --------------------------------------------------------------------------------
-- 4. FARE VERSIONS & DISTANCE SLABS SCHEMA
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fare_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    version_number INT UNIQUE NOT NULL,
    version_tag VARCHAR(128) NOT NULL,
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE fare_versions IS 'Fare versioning and release management registry for fare_rules provenance tracking.';

-- --------------------------------------------------------------------------------
-- 5. OPERATORS & FLEET MANAGEMENT
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    operator_name VARCHAR(128) NOT NULL,
    permit_registration VARCHAR(32) UNIQUE NOT NULL,
    phone_number VARCHAR(16) UNIQUE,
    association_name VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE operators IS 'Private transit vehicle operators registered with Transit Regulatory Council.';

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    registration_number VARCHAR(32) UNIQUE NOT NULL,
    vehicle_type VARCHAR(32) NOT NULL, -- 'matador', 'minibus', 'tatamagic', 'sharedvan', 'rickshaw', 'erickshaw', 'tavera'
    multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    capacity INT NOT NULL DEFAULT 14,
    permit_category permit_type_enum DEFAULT 'STAGE_CARRIAGE_PERMIT',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE vehicles IS 'Vehicle fleet units mapped to private operators supporting 7 vehicle types (matador, minibus, tatamagic, sharedvan, rickshaw, erickshaw, tavera) with fare multipliers and permit category classification.';

-- --------------------------------------------------------------------------------
-- 6. TRANSIT ROUTES & STOPS (POSTGIS SPATIAL ARCHITECTURE)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    route_code VARCHAR(32) UNIQUE NOT NULL,
    origin_name VARCHAR(128) NOT NULL,
    destination_name VARCHAR(128) NOT NULL,
    region VARCHAR(32) NOT NULL,
    terrain VARCHAR(32) NOT NULL,
    total_distance_km NUMERIC(6,2) NOT NULL,
    path GEOMETRY(LineString, 4326),
    is_active BOOLEAN DEFAULT TRUE,
    completeness_status VARCHAR(20) NOT NULL DEFAULT 'INCOMPLETE' CHECK (completeness_status IN ('INCOMPLETE', 'REVIEW', 'COMPLETE')),
    is_jkmt_notified BOOLEAN DEFAULT FALSE,
    jkmt_notification_ref VARCHAR(128) NULL,
    route_category VARCHAR(64) DEFAULT 'STAGE_CARRIAGE',
    verified_at TIMESTAMPTZ NULL,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    data_source VARCHAR(64) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_routes_completeness ON routes(completeness_status);
CREATE INDEX IF NOT EXISTS idx_routes_jkmt ON routes(is_jkmt_notified) WHERE is_jkmt_notified = TRUE;

COMMENT ON TABLE routes IS 'Transit routes with PostGIS LineString geometry, JKMT Act notification metadata, and audit completeness status.';

CREATE TABLE IF NOT EXISTS transit_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    external_stop_id VARCHAR(64) NULL,
    stop_name VARCHAR(128) NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    longitude NUMERIC(9,6) GENERATED ALWAYS AS (ST_X(location::geometry)) STORED,
    latitude NUMERIC(9,6) GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transit_stops_external_id ON transit_stops(external_stop_id);

COMMENT ON TABLE transit_stops IS 'Master list of physical transit stops with PostGIS geometries and external GTFS stop ID mapping.';

CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES transit_stops(id) ON DELETE CASCADE,
    stop_sequence INT NOT NULL,
    cumulative_distance_km NUMERIC(6,2) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_route_stop_seq UNIQUE (route_id, stop_sequence)
);

COMMENT ON TABLE route_stops IS 'Junction table defining the ordered sequence of transit stops on a route.';

-- --------------------------------------------------------------------------------
-- 6b. NON-LOCAL VEHICLE ROUTE PERMIT REGISTER
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS non_local_permits (
    id                             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permit_number                  VARCHAR(64) UNIQUE NOT NULL,
    vehicle_registration           VARCHAR(32) NOT NULL,
    operator_name                  VARCHAR(128) NOT NULL,
    home_state                     home_state_enum NOT NULL,
    home_state_reg_expiry          DATE NOT NULL,
    vehicle_category               permit_type_enum NOT NULL,
    permitted_route_id             UUID REFERENCES routes(id) ON DELETE SET NULL,
    permitted_corridor_description VARCHAR(256) NOT NULL,
    entry_border_post              VARCHAR(128) NOT NULL,
    inspection_checkpoint          VARCHAR(128) NOT NULL,
    valid_from                     TIMESTAMPTZ NOT NULL,
    valid_until                    TIMESTAMPTZ NOT NULL,
    challan_number                 VARCHAR(64) NOT NULL,
    tax_fee_amount                 NUMERIC(8,2) NOT NULL,
    tax_fee_paid_date              DATE NOT NULL,
    verification_status            permit_verification_status_enum DEFAULT 'PENDING',
    issued_by_authority            VARCHAR(128) NOT NULL,
    created_at                     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE non_local_permits IS 'Registry of non-local vehicle route permits entering J&K via border checkpoints. Status defaults to PENDING — requires explicit ADMIN/ENFORCEMENT_OFFICER approval via PATCH endpoint.';

-- Expiry backstop trigger (primary expiry check is always dynamic in API layer)
CREATE OR REPLACE FUNCTION check_permit_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.valid_until < NOW() THEN
    NEW.verification_status = 'EXPIRED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_permit_expiry
BEFORE INSERT OR UPDATE ON non_local_permits
FOR EACH ROW EXECUTE FUNCTION check_permit_expiry();

-- updated_at trigger — ensures accuracy regardless of Prisma or direct SQL update origin
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nlp_updated_at
BEFORE UPDATE ON non_local_permits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_nlp_vehicle_reg ON non_local_permits(vehicle_registration);
CREATE INDEX IF NOT EXISTS idx_nlp_status ON non_local_permits(verification_status);
CREATE INDEX IF NOT EXISTS idx_nlp_valid_until ON non_local_permits(valid_until);
CREATE INDEX IF NOT EXISTS idx_nlp_entry_border ON non_local_permits(entry_border_post);

-- --------------------------------------------------------------------------------
-- 7. TRIPS & CONDUCTOR CONSOLE SESSION
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    conductor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    fare_version_id UUID REFERENCES fare_versions(id),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'CANCELLED'
    occupancy_status VARCHAR(16) DEFAULT 'LIGHT', -- 'LIGHT', 'MODERATE', 'FULL'
    passenger_count INT DEFAULT 0,
    start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ
);

COMMENT ON TABLE trips IS 'Live conductor transit trips and real-time occupancy monitoring sessions.';

-- --------------------------------------------------------------------------------
-- 8. CONCESSION CATEGORIES
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(64) UNIQUE NOT NULL,
    discount_percentage NUMERIC(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    is_active BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE concessions IS 'State-regulated passenger fare concession categories (Student, Senior Citizen, PwD).';

-- --------------------------------------------------------------------------------
-- 9. PAYMENTS & HYBRID DISCREPANCY AUDIT LOG
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_method payment_method_enum NOT NULL DEFAULT 'CASH',
    calculated_fare_paise INT NOT NULL,
    actual_paid_paise INT DEFAULT NULL, -- Populated via post-trip audit
    payment_status payment_status_enum NOT NULL DEFAULT 'PENDING_PAYMENT',
    receipt_code VARCHAR(32) UNIQUE NOT NULL,
    discrepancy_amount_paise INT DEFAULT 0,
    discrepancy_flag BOOLEAN DEFAULT FALSE,
    severity severity_enum DEFAULT 'NONE',
    compliance_status compliance_status_enum DEFAULT 'COMPLIANT',
    conductor_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payments IS 'Core hybrid payment audit log storing locked fares and post-trip cash audit discrepancies.';

-- --------------------------------------------------------------------------------
-- 10. CASH RECEIPTS & QR CODE GENERATION
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    receipt_code VARCHAR(32) UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    boarding_stop VARCHAR(128) NOT NULL,
    deboarding_stop VARCHAR(128) NOT NULL,
    calculated_fare_rupees NUMERIC(6,2) NOT NULL,
    is_printed BOOLEAN DEFAULT FALSE,
    printed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE cash_receipts IS 'Stores physical receipt codes and QR payloads for conductor verification and senior citizen print delivery.';

-- --------------------------------------------------------------------------------
-- 11. OPERATOR COMPLIANCE LEADERBOARD
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operator_compliance_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
    total_trips_audited INT DEFAULT 0,
    compliant_trips INT DEFAULT 0,
    overcharge_trips INT DEFAULT 0,
    compliance_score NUMERIC(5,2) DEFAULT 100.00,
    total_overcharge_paise INT DEFAULT 0,
    inspection_flagged BOOLEAN DEFAULT FALSE,
    inspection_notes TEXT,
    last_inspection_date TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE operator_compliance_scores IS 'Aggregated compliance metrics and inspection history table for Transit Regulatory Council regulatory audit dashboards.';

-- --------------------------------------------------------------------------------
-- 12. OVERCHARGE DISPUTES LOG
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    discrepancy_paise INT NOT NULL,
    dispute_reason VARCHAR(256) NOT NULL,
    status dispute_status_enum DEFAULT 'OPEN',
    resolution_action VARCHAR(64), -- 'refund_issued', 'operator_warned', 'operator_suspended', 'dismissed'
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE disputes IS 'Commuter-logged fare dispute claims linked to operators and admins with resolution action audit fields.';

-- --------------------------------------------------------------------------------
-- 13. ADMIN AUDIT TRAIL LOG
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE admin_audit_log IS 'Immutable log of administrative configuration actions, client IP, and user-agent metadata for regulatory auditability.';

-- --------------------------------------------------------------------------------
-- 14. COMMUTER BUS PASS SUBSCRIPTIONS
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pass_number VARCHAR(32) UNIQUE NOT NULL,
    pass_type VARCHAR(32) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE bus_passes IS 'Digital bus pass passes and concession subscriptions.';

CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance_paise INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_wallets IS 'Commuter digital wallet ledger for prepaid transit fares and pass credits.';

CREATE TABLE IF NOT EXISTS digital_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pass_number VARCHAR(32) UNIQUE NOT NULL,
    pass_type VARCHAR(32) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) DEFAULT 'ACTIVE',
    price_paise INT NOT NULL,
    source_notification VARCHAR(128) NULL,
    verification_status VARCHAR(20) DEFAULT 'REVIEW_REQUIRED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE digital_passes IS 'Digital transit pass subscriptions mapped to commuters with regulatory notification reference metadata.';

-- --------------------------------------------------------------------------------
-- 15. USER GAMIFICATION (SAFAR COINS)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    coins_earned INT NOT NULL DEFAULT 0,
    coins_redeemed INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_coins IS 'Commuter gamification rewards ledger for honest cash audit reporting.';

-- --------------------------------------------------------------------------------
-- 16. SOS EMERGENCY DISTRESS ALERTS
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    longitude NUMERIC(9,6) GENERATED ALWAYS AS (ST_X(location::geometry)) STORED,
    latitude NUMERIC(9,6) GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED,
    description TEXT,
    pcr_reference_number VARCHAR(64),
    status sos_status_enum DEFAULT 'OPEN',
    triggered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

COMMENT ON TABLE sos_alerts IS 'Emergency SOS distress signals with PostGIS geometry positioning, Emergency Helpline (112) reference numbers, and dispatch lifecycle auditing.';

-- --------------------------------------------------------------------------------
-- INDEXING FOR PERFORMANCE & SPATIAL QUERIES
-- --------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fare_slabs_lookup ON fare_slabs(fare_version_id, region, terrain);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_seq ON route_stops(route_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_route_stops_geom ON route_stops USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_routes_path ON routes USING GIST(path);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_code ON payments(receipt_code);
CREATE INDEX IF NOT EXISTS idx_payments_compliance ON payments(compliance_status, severity);
CREATE INDEX IF NOT EXISTS idx_cash_receipts_code ON cash_receipts(receipt_code);
CREATE INDEX IF NOT EXISTS idx_operator_compliance ON operator_compliance_scores(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_flagged ON operator_compliance_scores(inspection_flagged) WHERE inspection_flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_location ON sos_alerts USING GIST(location);

-- Record Migration Version
INSERT INTO schema_migrations (version, description) VALUES
(301, 'Hardened SAFAR v3.0.1 schema with token rotation hashes, PostGIS SOS spatial tracking, and operator audit enhancements.')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_migrations (version, description) VALUES
(310, 'JKMT Act routes, SRO fare engine, non-local vehicle permits, ENFORCEMENT_OFFICER role, permit expiry triggers.')
ON CONFLICT (version) DO NOTHING;

-- --------------------------------------------------------------------------------
-- SAMPLE SEED DATA FOR DEMO & TESTING
-- --------------------------------------------------------------------------------

-- 1. Initial Tenant: J&K Transit Regulatory Council
INSERT INTO tenants (id, tenant_code, tenant_name, state_name) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'jk_srta', 'J&K State Regional Transport Authority', 'Jammu & Kashmir')
ON CONFLICT (tenant_code) DO NOTHING;

-- 2. Initial Admin & Driver User
INSERT INTO users (id, tenant_id, phone_number, full_name, role, password_hash) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '+919906000001', 'Admin Farhaan', 'ADMIN', '$2b$12$WvKz0...hash'),
('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '+919906000002', 'Driver Ghulam', 'DRIVER', '$2b$12$WvKz0...hash')
ON CONFLICT (phone_number) DO NOTHING;

-- 3. Active Fare Version (20260801)
INSERT INTO fare_versions (id, tenant_id, version_number, version_tag, published_by, is_active) VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 20260801, 'V20260801-Transit Regulatory Council', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', TRUE)
ON CONFLICT (version_number) DO NOTHING;


-- 4. Seed Routes & Stops (Srinagar ↔ Budgam)
INSERT INTO routes (id, tenant_id, route_code, origin_name, destination_name, region, terrain, total_distance_km) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'srn-budgam', 'Lal Chowk', 'Budgam Stand', 'Kashmir', 'plain', 14.00)
ON CONFLICT (route_code) DO NOTHING;

INSERT INTO transit_stops (id, tenant_id, stop_name, location) VALUES
('t1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lal Chowk', ST_SetSRID(ST_MakePoint(74.805800, 34.072200), 4326)),
('t1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jahangir Chowk', ST_SetSRID(ST_MakePoint(74.802000, 34.071000), 4326)),
('t1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rambagh', ST_SetSRID(ST_MakePoint(74.800000, 34.058000), 4326)),
('t1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Hyderpora', ST_SetSRID(ST_MakePoint(74.795000, 34.035000), 4326)),
('t1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Humhama', ST_SetSRID(ST_MakePoint(74.780000, 34.020000), 4326)),
('t1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Budgam Stand', ST_SetSRID(ST_MakePoint(74.720000, 34.015000), 4326))
ON CONFLICT DO NOTHING;

INSERT INTO route_stops (route_id, stop_id, stop_sequence, cumulative_distance_km) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 0.00),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 2, 1.20),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 3, 3.50),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 4, 6.20),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 5, 9.80),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 6, 14.00)
ON CONFLICT DO NOTHING;

-- 6. Seed Concession Categories
INSERT INTO concessions (category_name, discount_percentage) VALUES
('General', 0.00),
('Student', 50.00),
('Senior Citizen / PwD', 50.00)
ON CONFLICT (category_name) DO NOTHING;

-- 7. Seed Operators & Fleet Vehicles
INSERT INTO operators (id, tenant_id, operator_name, permit_registration, phone_number, association_name) VALUES
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Valley Transport Co', 'JK-02-B-4410', '+919906000010', 'Kashmir Mini Bus Association'),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pir Panjal Transit Services', 'JK-12-A-8820', '+919906000020', 'Jammu Regional Bus Union')
ON CONFLICT (permit_registration) DO NOTHING;

INSERT INTO vehicles (id, operator_id, registration_number, vehicle_type, multiplier, capacity) VALUES
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'JK01-AV-9912', 'matador', 1.00, 24),
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'JK02-CC-4421', 'minibus', 1.00, 32)
ON CONFLICT (registration_number) DO NOTHING;

-- --------------------------------------------------------------------------------
-- POSTGRESQL ROW-LEVEL SECURITY (RLS) POLICIES & SECURITY HARDENING
-- --------------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy Example for Users
DO $$ BEGIN
    DROP POLICY IF EXISTS tenant_isolation_users ON users;
    CREATE POLICY tenant_isolation_users ON users
        FOR ALL
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID OR current_setting('app.current_user_role', true) = 'SUPER_ADMIN');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- User Access Policy for Payments
DO $$ BEGIN
    DROP POLICY IF EXISTS user_payment_access ON payments;
    CREATE POLICY user_payment_access ON payments
        FOR ALL
        USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID OR current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPER_ADMIN', 'AUDITOR'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Admin Audit Log Access Policy
DO $$ BEGIN
    DROP POLICY IF EXISTS admin_audit_access ON admin_audit_log;
    CREATE POLICY admin_audit_access ON admin_audit_log
        FOR ALL
        USING (current_setting('app.current_user_role', true) IN ('ADMIN', 'SUPER_ADMIN', 'AUDITOR'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

COMMIT;

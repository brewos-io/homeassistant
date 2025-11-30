-- BrewOS Cloud Database Schema
-- Run this in Supabase SQL Editor
--
-- NOTE: The cloud service is STATELESS. Settings and shot history
-- are stored on the ESP32 device, not in the cloud.
-- This database only stores:
--   - Device ownership (who owns which device)
--   - Claim tokens (for QR code pairing)
--   - User profiles (extends Supabase auth)

-- =============================================================================
-- DEVICES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(32) PRIMARY KEY,              -- Device ID (e.g., BRW-A1B2C3D4)
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'My BrewOS',
    
    -- Device info (reported by device)
    firmware_version VARCHAR(20),
    hardware_version VARCHAR(20),
    machine_type VARCHAR(50),                -- dual_boiler, single_boiler, heat_exchanger
    
    -- Status
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DEVICE CLAIM TOKENS (for QR code pairing)
-- =============================================================================
CREATE TABLE IF NOT EXISTS device_claim_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(32) NOT NULL UNIQUE,
    token_hash VARCHAR(128) NOT NULL,        -- SHA256 of claim token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for cleanup queries
CREATE INDEX idx_claim_tokens_expires ON device_claim_tokens(expires_at);

-- =============================================================================
-- USER PROFILES (extends Supabase auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_claim_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Devices: users can only see/manage their own devices
CREATE POLICY "Users can view own devices" ON devices
    FOR SELECT USING (auth.uid() = owner_id);
    
CREATE POLICY "Users can update own devices" ON devices
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own devices" ON devices
    FOR DELETE USING (auth.uid() = owner_id);

-- Claim tokens: no direct user access (server-side only)
-- The service key is used for claim token operations

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Clean up expired claim tokens (call periodically via cron or Edge Function)
CREATE OR REPLACE FUNCTION cleanup_expired_claim_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM device_claim_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

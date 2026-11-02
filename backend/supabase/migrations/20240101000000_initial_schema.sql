-- UniMove Database Schema - Initial Setup
-- Description: Core tables for users, profiles, and basic structure
-- Optimized: Merged customer_profiles & provider_profiles into profiles (role-based columns)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- PROFILES (unified table for all user types)
-- =====================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    date_of_birth DATE,
    gender gender_type,
    role user_role NOT NULL DEFAULT 'customer',
    status user_status NOT NULL DEFAULT 'active',

    -- Customer-specific fields (NULL for providers/admins)
    student_id TEXT,
    university TEXT,
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    preferred_payment_method TEXT,

    -- Provider-specific fields (NULL for customers/admins)
    business_name TEXT,
    business_license TEXT,
    tax_code TEXT,
    vehicle_type TEXT,
    vehicle_plate TEXT,
    service_area TEXT[],
    base_price DECIMAL(10,2),
    price_per_km DECIMAL(10,2),
    price_per_floor DECIMAL(10,2),
    rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    verification_status verification_status DEFAULT 'pending',
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_name TEXT,

    -- Shared stats
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Address (shared)
    address TEXT,
    city TEXT,
    district TEXT,
    ward TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PROVIDER DOCUMENTS (for verification)
-- =====================================================

CREATE TABLE provider_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- license, id_card, vehicle_registration, insurance
    document_url TEXT NOT NULL,
    document_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_verified ON profiles(is_verified) WHERE role = 'provider';
CREATE INDEX idx_profiles_available ON profiles(is_available) WHERE role = 'provider';
CREATE INDEX idx_profiles_rating ON profiles(rating DESC) WHERE role = 'provider';
CREATE INDEX idx_provider_documents_provider ON provider_documents(provider_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_documents_updated_at BEFORE UPDATE ON provider_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE profiles IS 'Unified user profiles for customers, providers, and admins';
COMMENT ON TABLE provider_documents IS 'Documents uploaded by providers for verification';
COMMENT ON COLUMN profiles.student_id IS 'Customer only: student ID for university verification';
COMMENT ON COLUMN profiles.business_name IS 'Provider only: registered business name';
COMMENT ON COLUMN profiles.is_verified IS 'Provider only: whether provider is verified by admin';

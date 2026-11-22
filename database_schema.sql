-- ==============================================================================
-- APEXPARTS GLOBAL - PRODUCTION POSTGRESQL DATABASE STRUCTURE
-- Target Engine: PostgreSQL 14+ (Compatible with Cloud SQL, Neon, Supabase, RDS)
-- Specification: Complete schema for Precision Automotive Components Marketplace,
--                Direct-Email Payment Processing, Proof Verification, & RFQs.
-- ==============================================================================

-- 1. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CUSTOM ENUM TYPES
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'buyer',
    'mechanic_fleet',
    'supplier_foundry',
    'admin',
    'finance_desk'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'payment_pending',
    'payment_successful',
    'packaging_of_goods',
    'sending_and_transportation',
    'air_delivery',
    'delivered',
    'cancelled',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_stage AS ENUM (
    'packaging',
    'transportation',
    'air_delivery',
    'delivered'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM (
    'paypal',
    'venmo',
    'zelle',
    'apple_pay',
    'google_pay',
    'credit_debit_card'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM (
    'pending_review',
    'verified_approved',
    'rejected_invalid',
    'flagged_suspicious'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE part_condition AS ENUM (
    'oem_genuine',
    'aftermarket_hd',
    'performance_racing',
    'remanufactured_rebuilt'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE shipping_tier AS ENUM (
    'dhl_express',
    'standard_air',
    'ocean_freight'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rfq_urgency AS ENUM (
    'standard_48h',
    'urgent_4h',
    'immediate_sourcing'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rfq_status AS ENUM (
    'received',
    'sourcing_factories',
    'quotes_ready',
    'matched',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. CORE APPLICATION TABLES
-- ==============================================================================

-- 3.1 Users & Authentication Accounts
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  company_name VARCHAR(150),
  phone_number VARCHAR(50),
  street_address VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(30),
  country VARCHAR(100) DEFAULT 'United States',
  role user_role NOT NULL DEFAULT 'buyer',
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 Product Categories
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 Car Parts & Precision Components Catalog
CREATE TABLE IF NOT EXISTS parts (
  id VARCHAR(60) PRIMARY KEY,
  category_id VARCHAR(80) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  oem_number VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  vehicle_fitment TEXT[] NOT NULL DEFAULT '{}',
  condition part_condition NOT NULL DEFAULT 'oem_genuine',
  moq INT NOT NULL DEFAULT 1 CHECK (moq >= 1),
  max_order INT NOT NULL DEFAULT 1000 CHECK (max_order >= moq),
  base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
  unit VARCHAR(30) NOT NULL DEFAULT 'piece',
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating BETWEEN 1.00 AND 5.00),
  reviews_count INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  orders_count INT NOT NULL DEFAULT 0 CHECK (orders_count >= 0),
  lead_time_days INT NOT NULL DEFAULT 3,
  warranty_months INT NOT NULL DEFAULT 12,
  in_stock INT NOT NULL DEFAULT 100 CHECK (in_stock >= 0),
  is_ready_to_ship BOOLEAN NOT NULL DEFAULT true,
  is_trade_assurance BOOLEAN NOT NULL DEFAULT true,
  is_verified_supplier BOOLEAN NOT NULL DEFAULT true,
  weight_kg NUMERIC(8, 3),
  dimensions_mm VARCHAR(80),
  material VARCHAR(120),
  specifications JSONB DEFAULT '{}'::jsonb,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.4 Tiered Wholesale Volume Pricing
CREATE TABLE IF NOT EXISTS price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id VARCHAR(60) NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  min_qty INT NOT NULL CHECK (min_qty >= 1),
  max_qty INT CHECK (max_qty IS NULL OR max_qty >= min_qty),
  tier_price NUMERIC(12, 2) NOT NULL CHECK (tier_price >= 0),
  discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.5 Customer Orders
CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(40) PRIMARY KEY, -- e.g. ORD-2026-XXXX
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_email VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255) NOT NULL DEFAULT 'apexparts45@gmail.com',
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  volume_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (volume_discount >= 0),
  shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
  trade_assurance_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_method VARCHAR(100) NOT NULL,
  status order_status NOT NULL DEFAULT 'payment_pending',
  tracking_number VARCHAR(100) NOT NULL,
  estimated_delivery VARCHAR(100) NOT NULL,
  payment_verified BOOLEAN NOT NULL DEFAULT false,
  payment_verified_at TIMESTAMPTZ,
  fulfillment_stage fulfillment_stage,
  
  -- Consignee & Shipping Destination Snapshot
  consignee_name VARCHAR(150) NOT NULL,
  consignee_company VARCHAR(150),
  consignee_street VARCHAR(255) NOT NULL,
  consignee_city VARCHAR(100) NOT NULL,
  consignee_state VARCHAR(100),
  consignee_postal_code VARCHAR(30) NOT NULL,
  consignee_country VARCHAR(100) NOT NULL DEFAULT 'United States',
  consignee_phone VARCHAR(50) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.6 Itemized Order Lines
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(40) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  part_id VARCHAR(60) REFERENCES parts(id) ON DELETE RESTRICT,
  part_name VARCHAR(255) NOT NULL,
  oem_number VARCHAR(100) NOT NULL,
  quantity INT NOT NULL CHECK (quantity >= 1),
  unit VARCHAR(30) NOT NULL DEFAULT 'piece',
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.7 Payment Requests (Dispatched directly to apexparts45@gmail.com)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(40) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  client_email VARCHAR(255) NOT NULL,
  admin_notification_email VARCHAR(255) NOT NULL DEFAULT 'apexparts45@gmail.com',
  chosen_payment_method payment_method_type NOT NULL,
  method_display_label VARCHAR(100) NOT NULL,
  payment_notes TEXT,
  instructions_sent_notice TEXT DEFAULT 'Every payment method you choose, the information of the payment method will be sent to you via email.',
  email_dispatched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dispatch_payload JSONB DEFAULT '{}'::jsonb
);

-- 3.8 Proof Screenshot Verifications (OCR Engine & Authentication)
CREATE TABLE IF NOT EXISTS payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(40) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  client_email VARCHAR(255) NOT NULL,
  transaction_ref VARCHAR(100),
  screenshot_url TEXT NOT NULL,
  ocr_extracted_text TEXT,
  verified_method VARCHAR(50),
  verified_amount NUMERIC(12, 2),
  verification_status verification_status NOT NULL DEFAULT 'verified_approved',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verification_notes TEXT
);

-- 3.9 Custom Automotive Part Sourcing (RFQs)
CREATE TABLE IF NOT EXISTS sourcing_requests (
  id VARCHAR(40) PRIMARY KEY, -- e.g. RFQ-123456
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  vehicle_year VARCHAR(20),
  vehicle_make VARCHAR(80),
  vehicle_model VARCHAR(80),
  vehicle_trim_engine VARCHAR(100),
  vehicle_vin VARCHAR(30),
  part_name VARCHAR(255) NOT NULL,
  oem_number VARCHAR(100),
  condition part_condition NOT NULL DEFAULT 'oem_genuine',
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  target_budget VARCHAR(80),
  urgency rfq_urgency NOT NULL DEFAULT 'standard_48h',
  technical_notes TEXT,
  status rfq_status NOT NULL DEFAULT 'received',
  dispatched_to_email VARCHAR(255) NOT NULL DEFAULT 'apexparts45@gmail.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.10 System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(60) NOT NULL, -- e.g. 'order', 'payment_verification', 'rfq', 'user'
  entity_id VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,     -- e.g. 'order_created', 'ocr_payment_verified', 'rfq_dispatched'
  actor_email VARCHAR(255) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================

-- Index for searching orders by client email and status
CREATE INDEX IF NOT EXISTS idx_orders_client_email ON orders(client_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders(created_at DESC);

-- Index for sourcing requests (RFQs)
CREATE INDEX IF NOT EXISTS idx_sourcing_client_email ON sourcing_requests(client_email);
CREATE INDEX IF NOT EXISTS idx_sourcing_status ON sourcing_requests(status);
CREATE INDEX IF NOT EXISTS idx_sourcing_created_at_desc ON sourcing_requests(created_at DESC);

-- Index for catalog lookup
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category_id);
CREATE INDEX IF NOT EXISTS idx_parts_base_price ON parts(base_price);
CREATE INDEX IF NOT EXISTS idx_parts_oem_number ON parts(oem_number);
CREATE INDEX IF NOT EXISTS idx_parts_is_ready_to_ship ON parts(is_ready_to_ship);

-- GIN Index for JSONB specifications and vehicle fitment array
CREATE INDEX IF NOT EXISTS idx_parts_fitment_gin ON parts USING GIN(vehicle_fitment);
CREATE INDEX IF NOT EXISTS idx_parts_specs_gin ON parts USING GIN(specifications);

-- ==============================================================================
-- 5. AUTOMATED TIMESTAMP UPDATE TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_parts_updated_at
    BEFORE UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_sourcing_updated_at
    BEFORE UPDATE ON sourcing_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 6. INITIAL SEED DATA
-- ==============================================================================

-- Seed Categories
INSERT INTO categories (id, name, slug, description, icon, display_order)
VALUES
  ('micro-hardware', 'Micro Hardware & Fasteners', 'micro-hardware', 'Precision nylon trim clips, copper crush washers, titanium hex studs, and automotive micro-fuses.', 'Wrench', 1),
  ('tires-wheels', 'Tires, Wheels & Lug Hardware', 'tires-wheels', 'High-performance forged wheels, all-season touring tires, and cold-forged spline lug nuts.', 'Disc', 2),
  ('body-exterior', 'Body Panels & Exterior Trim', 'body-exterior', 'Carbon fiber splitters, aerodynamic diffusers, side skirts, and OEM bumper brackets.', 'Layers', 3),
  ('cabin-interior', 'Cabin Interior & Ergonomics', 'cabin-interior', 'Perforated leather steering wheels, aluminum pedal sets, and precision cabin air filters.', 'Sliders', 4),
  ('braking-suspension', 'Braking & Suspension Components', 'braking-suspension', 'Cross-drilled carbon-ceramic rotors, 6-piston monoblock calipers, and mono-tube coilovers.', 'Shield', 5),
  ('engine-transmission', 'Engine & Transmission Internals', 'engine-transmission', 'Billet twin-scroll turbos, forged connecting rods, high-flow injectors, and lightweight flywheels.', 'Cpu', 6),
  ('electrical-sensors', 'Electrical & Electronic Sensors', 'electrical-sensors', 'Wideband lambda oxygen sensors, MAP sensors, high-output alternators, and iridium spark plugs.', 'Zap', 7),
  ('cooling-exhaust', 'Cooling Systems & Exhaust Flow', 'cooling-exhaust', 'Triple-pass all-aluminum radiators, titanium cat-back systems, and high-temp silicone hoses.', 'Flame', 8)
ON CONFLICT (id) DO NOTHING;

-- Seed Admin Account (apexparts45@gmail.com)
INSERT INTO users (
  email,
  password_hash,
  full_name,
  company_name,
  phone_number,
  role,
  city,
  country
) VALUES (
  'apexparts45@gmail.com',
  crypt('ApexAdminSecure2026!', gen_salt('bf')),
  'ApexParts Finance & Operations Desk',
  'ApexParts Global Precision Exchange LLC',
  '+1 (800) 555-APEX',
  'admin',
  'Detroit',
  'United States'
) ON CONFLICT (email) DO NOTHING;

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================

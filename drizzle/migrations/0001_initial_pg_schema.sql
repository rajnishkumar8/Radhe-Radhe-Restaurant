-- ============================================================
-- SHRI RADHE RADHE RESTAURANT — POSTGRESQL INITIAL SCHEMA
-- Full Supabase & PostgreSQL Migration with Row Level Security (RLS)
-- ============================================================

-- Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'owner', 'manager', 'order_staff', 'menu_manager', 'driver');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fulfillment_type AS ENUM ('delivery', 'pickup');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('direct_upi', 'cash_on_delivery', 'pay_at_pickup', 'razorpay');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'payment_initiated', 'payment_claimed', 'payment_pending_verification',
        'payment_verified', 'payment_rejected', 'refund_pending', 'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending_payment', 'payment_claimed', 'payment_verified',
        'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dietary_type AS ENUM ('veg', 'non_veg', 'egg', 'vegan', 'jain');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_type AS ENUM ('percentage', 'flat', 'free_delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE busy_mode AS ENUM ('normal', 'busy', 'very_busy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('requested', 'confirmed', 'seated', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    auth_user_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(160),
    email VARCHAR(320) UNIQUE,
    phone VARCHAR(32),
    password_hash TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_signed_in TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Delivery Addresses
CREATE TABLE IF NOT EXISTS delivery_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label VARCHAR(60) NOT NULL,
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Darbhanga',
    postal_code VARCHAR(20) NOT NULL,
    landmark VARCHAR(160),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    discount_price DECIMAL(10, 2) CHECK (discount_price >= 0),
    image_url TEXT,
    image_placement VARCHAR(40) NOT NULL DEFAULT 'menu',
    dietary dietary_type NOT NULL DEFAULT 'veg',
    spice_level INT NOT NULL DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 3),
    prep_time_minutes INT NOT NULL DEFAULT 25,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Menu Variants
CREATE TABLE IF NOT EXISTS menu_variants (
    id SERIAL PRIMARY KEY,
    menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0
);

-- 6. Addon Groups & Addons
CREATE TABLE IF NOT EXISTS menu_addon_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    min_selection INT NOT NULL DEFAULT 0,
    max_selection INT NOT NULL DEFAULT 5,
    is_required BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS menu_item_addon_groups (
    id SERIAL PRIMARY KEY,
    menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    addon_group_id INT NOT NULL REFERENCES menu_addon_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menu_addons (
    id SERIAL PRIMARY KEY,
    addon_group_id INT NOT NULL REFERENCES menu_addon_groups(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0
);

-- 7. Coupons
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    description TEXT,
    discount_type coupon_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_cart_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    max_discount DECIMAL(10, 2),
    usage_limit INT,
    per_user_limit INT NOT NULL DEFAULT 1,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Orders & Order Items
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(32) UNIQUE NOT NULL,
    user_id INT REFERENCES profiles(id) ON DELETE SET NULL,
    customer_name VARCHAR(160) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    customer_email VARCHAR(320),
    fulfillment_type fulfillment_type NOT NULL DEFAULT 'delivery',
    payment_method payment_method NOT NULL DEFAULT 'direct_upi',
    payment_status payment_status NOT NULL DEFAULT 'payment_initiated',
    order_status order_status NOT NULL DEFAULT 'pending_payment',
    address_snapshot TEXT,
    address_notes TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    packaging_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    coupon_code_snapshot VARCHAR(32),
    assigned_driver_id INT REFERENCES profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name_snapshot VARCHAR(180) NOT NULL,
    variant_name_snapshot VARCHAR(100),
    unit_price_snapshot DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price_snapshot DECIMAL(10, 2) NOT NULL,
    special_instructions VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS order_item_addons (
    id SERIAL PRIMARY KEY,
    order_item_id INT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    addon_name_snapshot VARCHAR(120) NOT NULL,
    addon_price_snapshot DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(40),
    new_status VARCHAR(40) NOT NULL,
    changed_by_user_id INT REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method VARCHAR(30) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    upi_reference VARCHAR(64),
    proof_image_url TEXT,
    status payment_status NOT NULL DEFAULT 'payment_initiated',
    verified_by_user_id INT REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id SERIAL PRIMARY KEY,
    coupon_id INT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INT REFERENCES profiles(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Restaurant Settings
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    restaurant_name VARCHAR(160) NOT NULL DEFAULT 'Shri Radhe Radhe Restaurant',
    tagline VARCHAR(200) NOT NULL DEFAULT 'Authentic Dining & Culinary Hospitality on Lohna Road',
    phone VARCHAR(32) NOT NULL DEFAULT '+919876543210',
    email VARCHAR(320) NOT NULL DEFAULT 'contact@radheradhe.com',
    whatsapp VARCHAR(32) NOT NULL DEFAULT '+919876543210',
    address TEXT NOT NULL DEFAULT 'Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga, Bihar 847407',
    latitude DECIMAL(10, 7) NOT NULL DEFAULT 26.2182293,
    longitude DECIMAL(10, 7) NOT NULL DEFAULT 86.2272110,
    upi_id VARCHAR(100) NOT NULL DEFAULT 'radheradhe@upi',
    upi_name VARCHAR(160) NOT NULL DEFAULT 'Shri Radhe Radhe Restaurant',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    ordering_paused BOOLEAN NOT NULL DEFAULT FALSE,
    ordering_pause_message TEXT NOT NULL DEFAULT 'We are temporarily paused for kitchen restock. Online orders will resume shortly.',
    busy_mode busy_mode NOT NULL DEFAULT 'normal',
    prep_time_normal INT NOT NULL DEFAULT 30,
    prep_time_busy INT NOT NULL DEFAULT 50,
    prep_time_very_busy INT NOT NULL DEFAULT 75,
    min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    packaging_fee DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
    tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    base_delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 40.00,
    free_delivery_threshold DECIMAL(10, 2) NOT NULL DEFAULT 499.00,
    announcement_text TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Driver Telemetry
CREATE TABLE IF NOT EXISTS driver_locations (
    id BIGSERIAL PRIMARY KEY,
    driver_id INT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accuracy DECIMAL(6, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id INT REFERENCES profiles(id) ON DELETE SET NULL,
    actor_role VARCHAR(32),
    action VARCHAR(80) NOT NULL,
    resource VARCHAR(60) NOT NULL,
    resource_id INT,
    diff_snapshot JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES profiles(id) ON DELETE SET NULL,
    guest_name VARCHAR(160) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(320),
    party_size INT NOT NULL,
    reservation_date VARCHAR(32) NOT NULL,
    reservation_time VARCHAR(16) NOT NULL,
    status reservation_status NOT NULL DEFAULT 'requested',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_cat_avail ON menu_items (category_id, is_available, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_slug ON menu_items (slug);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_order ON driver_locations (order_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Insert Default Restaurant Settings row
INSERT INTO restaurant_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

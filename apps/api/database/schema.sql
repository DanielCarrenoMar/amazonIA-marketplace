-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS postgis;      -- spatial data support


-- ---------------------------------------------------------------------------
-- 1. Custom Types
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    -- Order Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
        CREATE TYPE order_status_enum AS ENUM (
            'PENDING',
            'PAID',
            'SHIPPED',
            'DELIVERED',
            'CANCELED',
            'REFUNDED'
        );
    END IF;

    -- User Roles
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM (
            'BUYER',
            'SELLER',
            'ADMIN'
        );
    END IF;
END$$;


-- ---------------------------------------------------------------------------
-- 2. user_account
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_account (
    id                          UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    username                    VARCHAR(50)              UNIQUE,
    full_name                   VARCHAR(255)             NOT NULL,
    national_id                 VARCHAR(50)              UNIQUE NOT NULL,
    age                         INTEGER                  CHECK (age IS NULL OR age >= 0),
    nationality                 VARCHAR(100),
    password_hash               VARCHAR(255)             NOT NULL,
    email                       VARCHAR(255)             UNIQUE NOT NULL,
    role                        user_role_enum           NOT NULL DEFAULT 'BUYER',
    phone_primary               VARCHAR(50),
    phone_secondary             VARCHAR(50),
    wallet_hash                 VARCHAR(255),
    -- Spatial location
    location_coords             GEOGRAPHY(Point, 4326),
    location_mapbox_id          VARCHAR(100),
    location_formatted_address  TEXT,
    location_city               VARCHAR(100),
    location_region             VARCHAR(100),
    -- Audit
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for proximity queries
CREATE INDEX IF NOT EXISTS idx_user_account_location_coords
    ON user_account USING GIST (location_coords);


-- ---------------------------------------------------------------------------
-- 3. tribe
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tribe (
    id                          INTEGER                  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                        VARCHAR(255)             NOT NULL,
    description                 TEXT,
    -- Spatial location
    location_coords             GEOGRAPHY(Point, 4326),
    location_mapbox_id          VARCHAR(100),
    location_formatted_address  TEXT
);


-- ---------------------------------------------------------------------------
-- 4. seller
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller (
    id                          UUID                     PRIMARY KEY,
    tribe_id                    INTEGER,
    rating                      INTEGER                  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    description                 TEXT,
    -- FK: seller IS-A user_account
    CONSTRAINT fk_seller_user
        FOREIGN KEY (id) REFERENCES user_account (id) ON DELETE CASCADE,
    -- FK: optional tribe membership
    CONSTRAINT fk_seller_tribe
        FOREIGN KEY (tribe_id) REFERENCES tribe (id) ON DELETE SET NULL
);


-- ---------------------------------------------------------------------------
-- 5. product_category
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_category (
    id                          INTEGER                  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name               VARCHAR(100)             NOT NULL,
    subcategory_name            VARCHAR(100)
);


-- ---------------------------------------------------------------------------
-- 6. product
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product (
    id                          UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id                   UUID                     NOT NULL,
    category_id                 INTEGER                  NOT NULL,
    name                        VARCHAR(255)             NOT NULL,
    description                 TEXT,
    price                       NUMERIC(12, 2)           NOT NULL CHECK (price >= 0),
    stock_available             INTEGER                  DEFAULT 0 CHECK (stock_available >= 0),
    average_rating              NUMERIC(3, 2)            CHECK (average_rating IS NULL OR (average_rating >= 1 AND average_rating <= 5)),
    -- Spatial location (physical pickup / origin)
    location_coords             GEOGRAPHY(Point, 4326),
    location_mapbox_id          VARCHAR(100),
    location_formatted_address  TEXT,
    location_city               VARCHAR(100),
    location_region             VARCHAR(100),
    -- Audit
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- FKs
    CONSTRAINT fk_product_seller
        FOREIGN KEY (seller_id) REFERENCES seller (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id) REFERENCES product_category (id)
);

-- Spatial index for proximity searches (e.g. "find products within 10 km")
CREATE INDEX IF NOT EXISTS idx_product_location_coords
    ON product USING GIST (location_coords);

-- Index for hot seller-based queries
CREATE INDEX IF NOT EXISTS idx_product_seller_id
    ON product (seller_id);

-- Trigger to auto-update updated_at on every row modification
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_updated_at ON product;
CREATE TRIGGER trg_product_updated_at
    BEFORE UPDATE ON product
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ---------------------------------------------------------------------------
-- 7. product_rating
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_rating (
    product_id                  UUID                     NOT NULL,
    user_account_id             UUID                     NOT NULL,
    rating_value                INTEGER                  NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, user_account_id),
    CONSTRAINT fk_rating_product
        FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE,
    CONSTRAINT fk_rating_user
        FOREIGN KEY (user_account_id) REFERENCES user_account (id) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------------
-- 8. product_order
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_order (
    id                          UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id                  UUID                     NOT NULL,
    buyer_id                    UUID                     NOT NULL,
    quantity                    INTEGER                  NOT NULL CHECK (quantity > 0),
    total_amount                NUMERIC(12, 2)           NOT NULL CHECK (total_amount >= 0),
    order_notes                 TEXT,
    -- Bilateral ratings recorded after fulfilment
    seller_rating_value         INTEGER                  CHECK (seller_rating_value IS NULL OR (seller_rating_value >= 1 AND seller_rating_value <= 5)),
    buyer_rating_value          INTEGER                  CHECK (buyer_rating_value IS NULL OR (buyer_rating_value >= 1 AND buyer_rating_value <= 5)),
    -- Blockchain / payment reference
    transaction_hash            VARCHAR(255),
    -- Current lifecycle state
    current_status              order_status_enum        NOT NULL DEFAULT 'PENDING',
    -- Audit
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- FKs
    CONSTRAINT fk_order_product
        FOREIGN KEY (product_id) REFERENCES product (id),
    CONSTRAINT fk_order_buyer
        FOREIGN KEY (buyer_id) REFERENCES user_account (id)
);

-- Index for buyer history lookups
CREATE INDEX IF NOT EXISTS idx_product_order_buyer_id
    ON product_order (buyer_id);

-- Index for filtering orders by status
CREATE INDEX IF NOT EXISTS idx_product_order_status
    ON product_order (current_status);

DROP TRIGGER IF EXISTS trg_product_order_updated_at ON product_order;
CREATE TRIGGER trg_product_order_updated_at
    BEFORE UPDATE ON product_order
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ---------------------------------------------------------------------------
-- 9. order_status_history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
    id                          INTEGER                  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id                    UUID                     NOT NULL,
    changed_by_user_id          UUID                     NOT NULL,
    previous_status             order_status_enum,        -- NULL on first transition (PENDING creation)
    new_status                  order_status_enum        NOT NULL,
    status_note                 TEXT,
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- FKs
    CONSTRAINT fk_history_order
        FOREIGN KEY (order_id) REFERENCES product_order (id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user
        FOREIGN KEY (changed_by_user_id) REFERENCES user_account (id)
);

-- Index for fetching the full history of a single order efficiently
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id
    ON order_status_history (order_id, created_at);

-- ---------------------------------------------------------------------------
-- 10. refresh_token
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_token (
    id                          UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID                     NOT NULL,
    token_hash                  VARCHAR(255)             NOT NULL,
    expires_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at                  TIMESTAMP WITH TIME ZONE,
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- FKs
    CONSTRAINT fk_refresh_token_user
        FOREIGN KEY (user_id) REFERENCES user_account (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_user_id
    ON refresh_token (user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_token_hash
    ON refresh_token (token_hash);

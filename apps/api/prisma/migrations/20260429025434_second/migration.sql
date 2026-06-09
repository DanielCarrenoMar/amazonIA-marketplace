CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "user_role_enum" AS ENUM ('BUYER', 'SELLER', 'ADMIN');

-- CreateEnum
CREATE TYPE "order_status_enum" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "blockchain_status_enum" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED');

-- CreateTable
CREATE TABLE "user_account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50),
    "full_name" VARCHAR(255) NOT NULL,
    "national_id" VARCHAR(50) NOT NULL,
    "age" INTEGER,
    "nationality" VARCHAR(100),
    "password_hash" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "user_role_enum" NOT NULL DEFAULT 'BUYER',
    "phone_primary" VARCHAR(50),
    "phone_secondary" VARCHAR(50),
    "wallet_hash" VARCHAR(255),
    "location_coords" geography(Point, 4326),
    "location_mapbox_id" VARCHAR(100),
    "location_formatted_address" TEXT,
    "location_city" VARCHAR(100),
    "location_region" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tribe" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location_coords" geography(Point, 4326),
    "location_mapbox_id" VARCHAR(100),
    "location_formatted_address" TEXT,

    CONSTRAINT "tribe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller" (
    "id" UUID NOT NULL,
    "tribe_id" INTEGER,
    "rating" INTEGER,
    "description" TEXT,

    CONSTRAINT "seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category" (
    "id" SERIAL NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "subcategory_name" VARCHAR(100),

    CONSTRAINT "product_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" UUID NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "stock_available" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "location_coords" geography(Point, 4326),
    "location_mapbox_id" VARCHAR(100),
    "location_formatted_address" TEXT,
    "location_city" VARCHAR(100),
    "location_region" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_rating" (
    "product_id" UUID NOT NULL,
    "user_account_id" UUID NOT NULL,
    "rating_value" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_rating_pkey" PRIMARY KEY ("product_id","user_account_id")
);

-- CreateTable
CREATE TABLE "product_order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "order_notes" TEXT,
    "seller_rating_value" INTEGER,
    "buyer_rating_value" INTEGER,
    "transaction_hash" VARCHAR(255),
    "current_status" "order_status_enum" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "product_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" SERIAL NOT NULL,
    "order_id" UUID NOT NULL,
    "changed_by_user_id" UUID NOT NULL,
    "previous_status" "order_status_enum",
    "new_status" "order_status_enum" NOT NULL,
    "status_note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_record" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "transaction_hash" VARCHAR(255),
    "block_number" INTEGER,
    "network_name" VARCHAR(50) NOT NULL DEFAULT 'arbitrum',
    "status" "blockchain_status_enum" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "gas_used" VARCHAR(50),
    "submitted_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_username_key" ON "user_account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_national_id_key" ON "user_account"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE INDEX "user_account_location_coords_idx" ON "user_account" USING GIST ("location_coords");

-- CreateIndex
CREATE INDEX "product_seller_id_idx" ON "product"("seller_id");

-- CreateIndex
CREATE INDEX "product_location_coords_idx" ON "product" USING GIST ("location_coords");

-- CreateIndex
CREATE INDEX "product_order_buyer_id_idx" ON "product_order"("buyer_id");

-- CreateIndex
CREATE INDEX "product_order_current_status_idx" ON "product_order"("current_status");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_record_order_id_key" ON "blockchain_record"("order_id");

-- CreateIndex
CREATE INDEX "blockchain_record_status_idx" ON "blockchain_record"("status");

-- CreateIndex
CREATE INDEX "blockchain_record_transaction_hash_idx" ON "blockchain_record"("transaction_hash");

-- AddForeignKey
ALTER TABLE "seller" ADD CONSTRAINT "seller_id_fkey" FOREIGN KEY ("id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller" ADD CONSTRAINT "seller_tribe_id_fkey" FOREIGN KEY ("tribe_id") REFERENCES "tribe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_rating" ADD CONSTRAINT "product_rating_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_rating" ADD CONSTRAINT "product_rating_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_order" ADD CONSTRAINT "product_order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_order" ADD CONSTRAINT "product_order_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "product_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_record" ADD CONSTRAINT "blockchain_record_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "product_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[primary_leader_id]` on the table `tribe` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[secondary_leader_id]` on the table `tribe` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "tribe_status_enum" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "membership_request_status_enum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "total_reviews" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "product_order" ADD COLUMN     "carrier_id" INTEGER,
ADD COLUMN     "tracking_number" VARCHAR(100);

-- AlterTable
ALTER TABLE "seller" ADD COLUMN     "avg_product_rating" DOUBLE PRECISION,
ADD COLUMN     "total_reviews" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tribe" ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "primary_leader_id" UUID,
ADD COLUMN     "requested_by_id" UUID,
ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMPTZ,
ADD COLUMN     "reviewed_by_id" UUID,
ADD COLUMN     "secondary_leader_id" UUID,
ADD COLUMN     "status" "tribe_status_enum" NOT NULL DEFAULT 'PENDING_APPROVAL';

-- CreateTable
CREATE TABLE "tribe_membership_request" (
    "id" SERIAL NOT NULL,
    "tribe_id" INTEGER NOT NULL,
    "seller_id" UUID NOT NULL,
    "status" "membership_request_status_enum" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "review_note" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tribe_membership_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_productos" (
    "id_comentario" SERIAL NOT NULL,
    "id_producto" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "comentario" TEXT NOT NULL,
    "id_respuesta" INTEGER,
    "fh_publicacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_productos_pkey" PRIMARY KEY ("id_comentario")
);

-- CreateTable
CREATE TABLE "shipping_carrier" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "website" VARCHAR(255),

    CONSTRAINT "shipping_carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat" (
    "id_mensaje" SERIAL NOT NULL,
    "id_pedido" UUID NOT NULL,
    "id_remitente" UUID NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fh_envio" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id_mensaje")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tribe_membership_request_tribe_id_status_idx" ON "tribe_membership_request"("tribe_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tribe_membership_request_tribe_id_seller_id_key" ON "tribe_membership_request"("tribe_id", "seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_carrier_name_key" ON "shipping_carrier"("name");

-- CreateIndex
CREATE INDEX "chat_id_pedido_fh_envio_idx" ON "chat"("id_pedido", "fh_envio");

-- CreateIndex
CREATE INDEX "outbox_events_published_at_idx" ON "outbox_events"("published_at");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_idx" ON "refresh_token"("user_id");

-- CreateIndex
CREATE INDEX "refresh_token_token_hash_idx" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "product_is_active_idx" ON "product"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "tribe_primary_leader_id_key" ON "tribe"("primary_leader_id");

-- CreateIndex
CREATE UNIQUE INDEX "tribe_secondary_leader_id_key" ON "tribe"("secondary_leader_id");

-- CreateIndex
CREATE INDEX "tribe_status_idx" ON "tribe"("status");

-- AddForeignKey
ALTER TABLE "tribe" ADD CONSTRAINT "tribe_primary_leader_id_fkey" FOREIGN KEY ("primary_leader_id") REFERENCES "seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tribe" ADD CONSTRAINT "tribe_secondary_leader_id_fkey" FOREIGN KEY ("secondary_leader_id") REFERENCES "seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tribe_membership_request" ADD CONSTRAINT "tribe_membership_request_tribe_id_fkey" FOREIGN KEY ("tribe_id") REFERENCES "tribe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tribe_membership_request" ADD CONSTRAINT "tribe_membership_request_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tribe_membership_request" ADD CONSTRAINT "tribe_membership_request_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_productos" ADD CONSTRAINT "comentarios_productos_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_productos" ADD CONSTRAINT "comentarios_productos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_productos" ADD CONSTRAINT "comentarios_productos_id_respuesta_fkey" FOREIGN KEY ("id_respuesta") REFERENCES "comentarios_productos"("id_comentario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_order" ADD CONSTRAINT "product_order_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "shipping_carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "product_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_id_remitente_fkey" FOREIGN KEY ("id_remitente") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "product_order" ADD COLUMN     "sensor_id" VARCHAR(100);

-- CreateIndex
CREATE INDEX "product_order_sensor_id_idx" ON "product_order"("sensor_id");

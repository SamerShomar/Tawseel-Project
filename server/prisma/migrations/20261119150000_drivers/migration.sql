-- Delivery drivers: a DRIVER role, admin approval, and the driver assigned to an order.
ALTER TYPE "Role" ADD VALUE 'DRIVER';

ALTER TABLE "users" ADD COLUMN "driver_approved_at" TIMESTAMP(3);

ALTER TABLE "orders" ADD COLUMN "driver_id" INTEGER;

CREATE INDEX "orders_driver_id_status_idx" ON "orders"("driver_id", "status");

ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

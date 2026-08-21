ALTER TABLE "orders" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "deleted_at" TIMESTAMP(3);
CREATE INDEX "idx_orders_deleted_at" ON "orders"("deleted_at");
CREATE INDEX "idx_products_deleted_at" ON "products"("deleted_at");

-- HU-001 & HU-011: Agregar campos SKU, código de barras y costo de adquisición al producto
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" VARCHAR(80);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" VARCHAR(80);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost" DECIMAL(14, 2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "products_barcode_key" ON "products"("barcode");
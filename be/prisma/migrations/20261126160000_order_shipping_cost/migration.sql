-- Los pedidos anteriores conservan sus importes originales.
ALTER TABLE "orders" ADD COLUMN "shipping_cost" DECIMAL(14,2) NOT NULL DEFAULT 0;

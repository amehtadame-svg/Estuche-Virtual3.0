
-- CreateTable
CREATE TABLE "combos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "sku" VARCHAR(80) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "price" DECIMAL(14,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "combo_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "combo_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "combos_sku_key" ON "combos"("sku");
CREATE INDEX "idx_combos_deleted_at" ON "combos"("deleted_at");
CREATE UNIQUE INDEX "combo_items_combo_product_unique" ON "combo_items"("combo_id", "product_id");
CREATE INDEX "idx_combo_items_combo" ON "combo_items"("combo_id");
CREATE INDEX "idx_combo_items_product" ON "combo_items"("product_id");

-- AddForeignKey
ALTER TABLE "combos" ADD CONSTRAINT "combos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
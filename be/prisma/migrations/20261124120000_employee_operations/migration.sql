-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('delivery', 'pickup');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('picking', 'packed', 'blocked', 'dispatched', 'completed');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "delivery_snapshot" VARCHAR(500),
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "fulfillment_method" "FulfillmentMethod" NOT NULL DEFAULT 'delivery',
ADD COLUMN     "request_hash" VARCHAR(64),
ADD COLUMN     "request_key" UUID,
ADD COLUMN     "stock_released_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "order_details" ADD COLUMN     "picked_quantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN     "request_hash" VARCHAR(64),
ADD COLUMN     "request_key" UUID;

-- CreateTable
CREATE TABLE "order_work" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "assignee_id" UUID NOT NULL,
    "status" "WorkStatus" NOT NULL DEFAULT 'picking',
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "packed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "pickup_code_hash" VARCHAR(64),
    "incident" VARCHAR(500),

    CONSTRAINT "order_work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(60) NOT NULL,
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_work_order_id_key" ON "order_work"("order_id");

-- CreateIndex
CREATE INDEX "order_work_assignee_id_status_idx" ON "order_work"("assignee_id", "status");

-- CreateIndex
CREATE INDEX "order_events_order_id_created_at_idx" ON "order_events"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_events_actor_id_created_at_idx" ON "order_events"("actor_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_request_key_key" ON "orders"("request_key");

-- CreateIndex
CREATE INDEX "orders_created_by_id_order_date_idx" ON "orders"("created_by_id", "order_date");

-- CreateIndex
CREATE INDEX "orders_expires_at_status_idx" ON "orders"("expires_at", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_request_key_key" ON "inventory_movements"("request_key");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_work" ADD CONSTRAINT "order_work_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_work" ADD CONSTRAINT "order_work_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Las tablas operativas no se exponen a clientes de Supabase REST.
ALTER TABLE "order_work" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "order_work", "order_events" FROM PUBLIC;
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_picked_valid"
  CHECK ("picked_quantity" >= 0 AND "picked_quantity" <= "quantity") NOT VALID;
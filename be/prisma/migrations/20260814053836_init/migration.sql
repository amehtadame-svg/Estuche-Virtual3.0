-- CreateEnum
CREATE TYPE "Role" AS ENUM ('client', 'employee', 'delivery', 'admin', 'superadmin');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'canceled', 'returned');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'approved', 'rejected', 'refunded');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('pending', 'paid', 'partial', 'overdue', 'voided');

-- CreateEnum
CREATE TYPE "DespatchStatus" AS ENUM ('in_transit', 'delivered', 'returned', 'canceled');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('requested', 'approved', 'rejected', 'refunded');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('in', 'out', 'adjustment');

-- CreateEnum
CREATE TYPE "PromotionalCodeType" AS ENUM ('percentage', 'fixed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "password_updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "phone" VARCHAR(30),
    "address" VARCHAR(255),
    "role" "Role" NOT NULL DEFAULT 'client',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" VARCHAR(255),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "data_consent_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "customer_id" UUID,
    "driver_id" UUID,
    "promotional_code_id" UUID,
    "delivery_address_id" UUID,
    "order_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "price" DECIMAL(14,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_min" INTEGER NOT NULL DEFAULT 5,
    "category_id" UUID,
    "supplier_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(255),
    "address" VARCHAR(255),

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_details" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2),

    CONSTRAINT "order_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despatches" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "order_id" UUID NOT NULL,
    "ship_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "status" "DespatchStatus" NOT NULL DEFAULT 'in_transit',
    "driver_id" UUID,
    "address" VARCHAR(255),

    CONSTRAINT "despatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "product_id" UUID NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" VARCHAR(500),
    "user_id" UUID,
    "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "receipt_number" SERIAL NOT NULL,
    "customer_id" UUID,
    "employee_id" UUID,
    "order_id" UUID,
    "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "payment_status" "ReceiptStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotional_codes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "type" "PromotionalCodeType" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "min_purchase" DECIMAL(14,2) DEFAULT 0,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "max_uses" INTEGER,
    "current_uses" INTEGER DEFAULT 0,
    "active" BOOLEAN DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "promotional_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "receipt_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2),

    CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returns" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "order_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'requested',
    "product_condition" VARCHAR(30) NOT NULL DEFAULT 'good',
    "refund" DECIMAL(14,2) DEFAULT 0,
    "requested_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_addresses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "contact_name" VARCHAR(150),
    "phone" VARCHAR(30),
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(150),
    "state" VARCHAR(150),
    "is_primary" BOOLEAN DEFAULT false,

    CONSTRAINT "delivery_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "product_id" UUID NOT NULL,
    "previous_price" DECIMAL(14,2) NOT NULL,
    "new_price" DECIMAL(14,2) NOT NULL,
    "changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "product_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "name" VARCHAR(150),
    "is_primary" BOOLEAN DEFAULT false,
    "sort_order" INTEGER DEFAULT 1,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "added_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "receipt_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "gateway" VARCHAR(50) NOT NULL,
    "transaction_id" VARCHAR(255) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "method" VARCHAR(50),
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'COP',
    "paid_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "gateway_token" VARCHAR(255),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "date" DATE NOT NULL,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "delivered_orders" INTEGER NOT NULL DEFAULT 0,
    "canceled_orders" INTEGER NOT NULL DEFAULT 0,
    "total_sold" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_refunded" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "products_sold" INTEGER NOT NULL DEFAULT 0,
    "new_customers" INTEGER NOT NULL DEFAULT 0,
    "generated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" VARCHAR(1000),
    "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_categories" (
    "provider_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "provider_categories_pkey" PRIMARY KEY ("provider_id","category_id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "user_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "detail" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_locked_until" ON "users"("locked_until");

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_orders_customer" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "idx_orders_driver" ON "orders"("driver_id");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_supplier" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_order_details_order" ON "order_details"("order_id");

-- CreateIndex
CREATE INDEX "idx_despatches_order" ON "despatches"("order_id");

-- CreateIndex
CREATE INDEX "idx_inventory_movements_product" ON "inventory_movements"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_order_id_key" ON "receipts"("order_id");

-- CreateIndex
CREATE INDEX "idx_receipts_customer" ON "receipts"("customer_id");

-- CreateIndex
CREATE INDEX "idx_receipts_employee" ON "receipts"("employee_id");

-- CreateIndex
CREATE INDEX "idx_receipts_order" ON "receipts"("order_id");

-- CreateIndex
CREATE INDEX "idx_shopping_user" ON "shopping"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shopping_user_product_unique" ON "shopping"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotional_codes_code_key" ON "promotional_codes"("code");

-- CreateIndex
CREATE INDEX "idx_receipt_items_receipt" ON "receipt_items"("receipt_id");

-- CreateIndex
CREATE INDEX "idx_returns_order" ON "returns"("order_id");

-- CreateIndex
CREATE INDEX "idx_delivery_addresses_user" ON "delivery_addresses"("user_id");

-- CreateIndex
CREATE INDEX "idx_price_history_product" ON "price_history"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_images_product" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "idx_wishlist_user" ON "wishlist"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_user_product_unique" ON "wishlist"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_transaction_id_key" ON "payouts"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_payouts_receipt" ON "payouts"("receipt_id");

-- CreateIndex
CREATE INDEX "idx_payouts_user" ON "payouts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_date_key" ON "reports"("date");

-- CreateIndex
CREATE INDEX "idx_reports_date" ON "reports"("date");

-- CreateIndex
CREATE INDEX "idx_reviews_product" ON "reviews"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_product_user_unique" ON "reviews"("product_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_security_events_user" ON "security_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_security_events_type_date" ON "security_events"("type", "date");

-- CreateIndex
CREATE INDEX "idx_security_events_ip_date" ON "security_events"("ip", "date");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_promotional_code_id_fkey" FOREIGN KEY ("promotional_code_id") REFERENCES "promotional_codes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "delivery_addresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "despatches" ADD CONSTRAINT "despatches_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "despatches" ADD CONSTRAINT "despatches_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shopping" ADD CONSTRAINT "shopping_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shopping" ADD CONSTRAINT "shopping_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delivery_addresses" ADD CONSTRAINT "delivery_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

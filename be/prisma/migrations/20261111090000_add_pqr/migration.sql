CREATE TYPE "PqrType" AS ENUM ('petition', 'complaint', 'claim');
CREATE TYPE "PqrStatus" AS ENUM ('received', 'in_progress', 'answered', 'closed');

CREATE TABLE "pqr_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
    "customer_id" UUID NOT NULL,
    "type" "PqrType" NOT NULL,
    "subject" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PqrStatus" NOT NULL DEFAULT 'received',
    "response" TEXT,
    "responded_by_id" UUID,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pqr_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_pqr_customer_created"
ON "pqr_requests"("customer_id", "created_at");

CREATE INDEX "idx_pqr_status_created"
ON "pqr_requests"("status", "created_at");

ALTER TABLE "pqr_requests"
ADD CONSTRAINT "pqr_requests_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "pqr_requests"
ADD CONSTRAINT "pqr_requests_responded_by_id_fkey"
FOREIGN KEY ("responded_by_id") REFERENCES "users"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;
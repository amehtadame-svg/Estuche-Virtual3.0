-- Conversaciones internas entre empleados y supervisores.
CREATE TABLE "support_threads" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
  "creator_id" UUID NOT NULL,
  "subject" VARCHAR(150) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_threads_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_threads_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "support_threads_creator_id_updated_at_idx" ON "support_threads"("creator_id", "updated_at");
CREATE INDEX "support_threads_updated_at_idx" ON "support_threads"("updated_at");
CREATE TABLE "support_messages" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v7(),
  "thread_id" UUID NOT NULL,
  "sender_id" UUID NOT NULL,
  "body" VARCHAR(2000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "support_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "support_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "support_messages_thread_id_created_at_idx" ON "support_messages"("thread_id", "created_at");

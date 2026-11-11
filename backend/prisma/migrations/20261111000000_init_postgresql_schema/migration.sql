-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(50),
    "avatar_url" VARCHAR(500),
    "designation" VARCHAR(255),
    "department" VARCHAR(255),
    "assigned_states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ayush_categories" (
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "regulatory_authority" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ayush_categories_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "document_types" (
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "allowed_formats" VARCHAR(100) NOT NULL DEFAULT '.pdf,.jpg,.jpeg,.png',
    "max_size_mb" INTEGER NOT NULL DEFAULT 5,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "startups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "legal_name" VARCHAR(255) NOT NULL,
    "brand_name" VARCHAR(255) NOT NULL,
    "incorporation_date" DATE,
    "incorporation_type" VARCHAR(100),
    "registration_number" VARCHAR(100),
    "official_email" VARCHAR(255),
    "website" VARCHAR(255),
    "ayush_domain" VARCHAR(50) NOT NULL,
    "business_activities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "products" TEXT,
    "business_stage" VARCHAR(50),
    "target_market" VARCHAR(255),
    "operational_status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "state" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100),
    "dpiit_recognized" BOOLEAN NOT NULL DEFAULT false,
    "dpiit_number" VARCHAR(100),
    "existing_licences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "startup_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "qualification" VARCHAR(255) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "founders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" VARCHAR(50) NOT NULL,
    "startup_id" UUID NOT NULL,
    "ayush_domain" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Draft',
    "state" VARCHAR(100) NOT NULL,
    "assigned_officer_id" UUID,
    "regulatory_details" JSONB DEFAULT '{}',
    "business_details_snapshot" JSONB DEFAULT '{}',
    "certificate_number" VARCHAR(100),
    "certificate_issued_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" VARCHAR(50),
    "startup_id" UUID NOT NULL,
    "document_type_code" VARCHAR(50),
    "name" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" VARCHAR(50) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    "status" VARCHAR(50) NOT NULL DEFAULT 'Uploaded',
    "remark" TEXT,
    "verified_by_id" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" VARCHAR(50) NOT NULL,
    "previous_status" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL,
    "remark" TEXT NOT NULL,
    "officer_name" VARCHAR(255),
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clarification_queries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" VARCHAR(50) NOT NULL,
    "officer_id" UUID NOT NULL,
    "query_text" TEXT NOT NULL,
    "response_text" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "clarification_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'status_update',
    "application_id" VARCHAR(50),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "actor_name" VARCHAR(255) NOT NULL,
    "actor_role" VARCHAR(50) NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "target_entity" VARCHAR(100) NOT NULL,
    "target_id" VARCHAR(100) NOT NULL,
    "details" TEXT NOT NULL,
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ayush_categories_name_key" ON "ayush_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "startups_user_id_key" ON "startups"("user_id");

-- CreateIndex
CREATE INDEX "idx_startups_user" ON "startups"("user_id");

-- CreateIndex
CREATE INDEX "idx_startups_domain" ON "startups"("ayush_domain");

-- CreateIndex
CREATE INDEX "idx_founders_startup" ON "founders"("startup_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_certificate_number_key" ON "applications"("certificate_number");

-- CreateIndex
CREATE INDEX "idx_applications_status" ON "applications"("status");

-- CreateIndex
CREATE INDEX "idx_applications_startup" ON "applications"("startup_id");

-- CreateIndex
CREATE INDEX "idx_applications_officer" ON "applications"("assigned_officer_id");

-- CreateIndex
CREATE INDEX "idx_applications_domain" ON "applications"("ayush_domain");

-- CreateIndex
CREATE INDEX "idx_documents_application" ON "documents"("application_id");

-- CreateIndex
CREATE INDEX "idx_documents_startup" ON "documents"("startup_id");

-- CreateIndex
CREATE INDEX "idx_documents_status" ON "documents"("status");

-- CreateIndex
CREATE INDEX "idx_status_history_application" ON "application_status_history"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_queries_application" ON "clarification_queries"("application_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user_read" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "startups" ADD CONSTRAINT "startups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "startups" ADD CONSTRAINT "startups_ayush_domain_fkey" FOREIGN KEY ("ayush_domain") REFERENCES "ayush_categories"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founders" ADD CONSTRAINT "founders_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_ayush_domain_fkey" FOREIGN KEY ("ayush_domain") REFERENCES "ayush_categories"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_startup_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_document_type_code_fkey" FOREIGN KEY ("document_type_code") REFERENCES "document_types"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarification_queries" ADD CONSTRAINT "clarification_queries_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarification_queries" ADD CONSTRAINT "clarification_queries_officer_id_fkey" FOREIGN KEY ("officer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

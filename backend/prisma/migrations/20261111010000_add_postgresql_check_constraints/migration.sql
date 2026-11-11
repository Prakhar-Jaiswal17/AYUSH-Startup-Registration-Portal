-- Preserve the PostgreSQL CHECK constraints from database/schema.sql.
ALTER TABLE "users"
  ADD CONSTRAINT "users_role_check"
  CHECK ("role" IN ('startup', 'officer', 'admin'));

ALTER TABLE "document_types"
  ADD CONSTRAINT "document_types_category_check"
  CHECK ("category" IN ('incorporation', 'regulatory', 'clinical', 'financial', 'other')),
  ADD CONSTRAINT "document_types_max_size_mb_check"
  CHECK ("max_size_mb" > 0);

ALTER TABLE "applications"
  ADD CONSTRAINT "applications_status_check"
  CHECK ("status" IN ('Draft', 'Submitted', 'Under Review', 'Clarification Required', 'Resubmitted', 'Approved', 'Rejected'));

ALTER TABLE "documents"
  ADD CONSTRAINT "documents_status_check"
  CHECK ("status" IN ('Uploaded', 'Pending Verification', 'Verified', 'Rejected'));

ALTER TABLE "application_status_history"
  ADD CONSTRAINT "application_status_history_previous_status_check"
  CHECK ("previous_status" IS NULL OR "previous_status" IN ('Draft', 'Submitted', 'Under Review', 'Clarification Required', 'Resubmitted', 'Approved', 'Rejected')),
  ADD CONSTRAINT "application_status_history_status_check"
  CHECK ("status" IN ('Draft', 'Submitted', 'Under Review', 'Clarification Required', 'Resubmitted', 'Approved', 'Rejected'));

ALTER TABLE "clarification_queries"
  ADD CONSTRAINT "clarification_queries_status_check"
  CHECK ("status" IN ('Pending', 'Resolved'));

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_role_check"
  CHECK ("actor_role" IN ('startup', 'officer', 'admin', 'system'));

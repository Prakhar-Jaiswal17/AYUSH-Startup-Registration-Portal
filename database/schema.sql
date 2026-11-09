
-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in reverse dependency order (clean state)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS clarification_queries CASCADE;
DROP TABLE IF EXISTS application_status_history CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS founders CASCADE;
DROP TABLE IF EXISTS startups CASCADE;
DROP TABLE IF EXISTS document_types CASCADE;
DROP TABLE IF EXISTS ayush_categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Authentication, profile details, and role assignments (startup, officer, admin)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('startup', 'officer', 'admin')),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    designation VARCHAR(255),
    department VARCHAR(255),
    assigned_states TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. AYUSH CATEGORIES (Master Data)
-- Statutory AYUSH streams: Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homoeopathy
-- ----------------------------------------------------------------------------
CREATE TABLE ayush_categories (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    regulatory_authority VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. DOCUMENT TYPES (Master Data)
-- Compliance document checklist, file size limits, and allowed MIME types
-- ----------------------------------------------------------------------------
CREATE TABLE document_types (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('incorporation', 'regulatory', 'clinical', 'financial', 'other')),
    allowed_formats VARCHAR(100) NOT NULL DEFAULT '.pdf,.jpg,.jpeg,.png',
    max_size_mb INTEGER NOT NULL DEFAULT 5 CHECK (max_size_mb > 0),
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE
);

-- ----------------------------------------------------------------------------
-- 4. STARTUPS TABLE
-- Verified corporate profile data decoupled from specific application filings
-- ----------------------------------------------------------------------------
CREATE TABLE startups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    legal_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    incorporation_date DATE,
    incorporation_type VARCHAR(100),
    registration_number VARCHAR(100),
    official_email VARCHAR(255),
    website VARCHAR(255),
    ayush_domain VARCHAR(50) NOT NULL REFERENCES ayush_categories(code) ON DELETE RESTRICT,
    business_activities TEXT[] DEFAULT '{}',
    description TEXT,
    products TEXT,
    business_stage VARCHAR(50),
    target_market VARCHAR(255),
    operational_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    dpiit_recognized BOOLEAN NOT NULL DEFAULT FALSE,
    dpiit_number VARCHAR(100),
    existing_licences TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. FOUNDERS TABLE
-- Normalized 1:N founder details (satisfies 1NF, up to 3 co-founders)
-- ----------------------------------------------------------------------------
CREATE TABLE founders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. APPLICATIONS TABLE
-- Core application submission lifecycle, tracking number, and adjudication
-- ----------------------------------------------------------------------------
CREATE TABLE applications (
    id VARCHAR(50) PRIMARY KEY, -- Formatted: APP-YYYY-XXX
    startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    ayush_domain VARCHAR(50) NOT NULL REFERENCES ayush_categories(code) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN (
        'Draft', 
        'Submitted', 
        'Under Review', 
        'Clarification Required', 
        'Resubmitted', 
        'Approved', 
        'Rejected'
    )),
    state VARCHAR(100) NOT NULL,
    assigned_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    regulatory_details JSONB DEFAULT '{}'::jsonb,
    business_details_snapshot JSONB DEFAULT '{}'::jsonb,
    certificate_number VARCHAR(100) UNIQUE,
    certificate_issued_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. DOCUMENTS TABLE
-- Uploaded files, secure URLs, and reviewer verification statuses
-- ----------------------------------------------------------------------------
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE CASCADE,
    startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    document_type_code VARCHAR(50) REFERENCES document_types(code) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    status VARCHAR(50) NOT NULL DEFAULT 'Uploaded' CHECK (status IN (
        'Uploaded', 
        'Pending Verification', 
        'Verified', 
        'Rejected'
    )),
    remark TEXT,
    verified_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. APPLICATION STATUS HISTORY TABLE
-- Immutable transition log tracking previous status, new status, actor, and remarks
-- ----------------------------------------------------------------------------
CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(50) CHECK (previous_status IS NULL OR previous_status IN (
        'Draft', 'Submitted', 'Under Review', 'Clarification Required', 'Resubmitted', 'Approved', 'Rejected'
    )),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'Draft', 'Submitted', 'Under Review', 'Clarification Required', 'Resubmitted', 'Approved', 'Rejected'
    )),
    remark TEXT NOT NULL,
    officer_name VARCHAR(255),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. CLARIFICATION QUERIES TABLE
-- Structured query and response cycle for 'Clarification Required' state
-- ----------------------------------------------------------------------------
CREATE TABLE clarification_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    response_text TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 10. NOTIFICATIONS TABLE
-- User-specific alerts with read/unread tracking
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'status_update',
    application_id VARCHAR(50) REFERENCES applications(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. AUDIT LOGS TABLE
-- System-wide immutable administrative audit trails
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL CHECK (actor_role IN ('startup', 'officer', 'admin', 'system')),
    action VARCHAR(255) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- Strategic B-Tree indexes for frequently queried, joined, and filtered columns
-- ============================================================================

-- Users & Startups
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_startups_user ON startups(user_id);
CREATE INDEX idx_startups_domain ON startups(ayush_domain);
CREATE INDEX idx_founders_startup ON founders(startup_id);

-- Applications
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_startup ON applications(startup_id);
CREATE INDEX idx_applications_officer ON applications(assigned_officer_id);
CREATE INDEX idx_applications_domain ON applications(ayush_domain);

-- Documents
CREATE INDEX idx_documents_application ON documents(application_id);
CREATE INDEX idx_documents_startup ON documents(startup_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Workflow & History
CREATE INDEX idx_status_history_application ON application_status_history(application_id, created_at);
CREATE INDEX idx_queries_application ON clarification_queries(application_id);

-- Notifications & Audit
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);


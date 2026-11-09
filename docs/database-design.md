# Relational Database Design Specification

## 1. Executive Summary & Design Principles

This document specifies the relational database design for the **AYUSH Startup Registration Portal**, developed in accordance with **Database Management Systems (DBMS)** and **Advanced Software Development (ASD)** principles.

The schema design directly reflects the operational requirements of the React 19 frontend application:
- **Role-Based Access**: Multi-persona access for *Startup Applicants*, *Government Reviewers*, and *Administrators*.
- **Multi-Step Application Lifecycle**: Detailed data capture across the 7-step startup registration form.
- **Asynchronous Review & Clarification**: Structured document verification, reviewer queries, and applicant resubmissions.
- **Strict Normalization (3NF)**: Redundancy elimination, clean primary/foreign key dependencies, and relational integrity.
- **Auditability & Compliance**: Append-only status histories and system audit trails for government transparency.

---

## 2. Entity Rationalization & Finalized Entity List

The initial candidate entities were analyzed against the frontend architecture, resulting in the following design decisions:

| Candidate Entity | Final Entity Name | Status | Design Decision & Architectural Reasoning |
| :--- | :--- | :---: | :--- |
| **User** | `users` | Retained | Core authentication and identity table supporting `startup`, `officer`, and `admin` roles. |
| **Startup** | `startups` | Retained | Stores corporate entity information (CIN, brand, incorporation date, state) separate from individual application submissions. |
| **Founder** | `founders` | Retained | Normalized into a 1:N table to eliminate multivalued founder arrays from `startups` (1NF compliance). |
| **Category** | `ayush_categories` & `document_types` | Expanded | Separated into two master lookup tables: one for the 5 AYUSH streams and another for compliance document types, supporting admin master data management (`AdminCategories.jsx`). |
| **Application** | `applications` | Retained | Core workflow entity tracking submission lifecycle, assigned officer, AYUSH stream, and certification data. |
| **Document** | `documents` | Retained | Stores metadata, secure storage URLs, file sizes, and individual reviewer verification outcomes for uploaded compliance files. |
| **Review** & **StatusHistory** | `application_status_history` | Combined | Rather than creating a detached review entity, review decisions manifest as status transitions with remarks, officer stamps, and timestamps. This mirrors the frontend `<Timeline>` model directly. |
| **Query** | `clarification_queries` | Retained | Explicitly tracks clarification requests raised by officers and responses provided by applicants during the `Clarification Required` state. |
| **Notification** | `notifications` | Retained | Stores user-scoped in-app alerts, tracking unread counts and linking directly to related applications. |
| **AuditLog** | `audit_logs` | Retained | Immutable system log for administrative oversight, security auditing, and CSV exports (`AdminAuditLogs.jsx`). |

---

## 3. Detailed Entity Attribute Specifications

### 3.1 `users` Table
Stores authentication credentials, profile data, and role assignments.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default `gen_random_uuid()` | Unique identifier for each system user. |
| `email` | `VARCHAR(255)` | **Unique**, Not Null | Official login email address. |
| `password_hash` | `VARCHAR(255)` | Not Null | Bcrypt salted and hashed password ($\ge 10$ rounds). |
| `full_name` | `VARCHAR(255)` | Not Null | Full legal name of user or officer. |
| `role` | `VARCHAR(20)` | Not Null | Enum-like constraint: `'startup'`, `'officer'`, `'admin'`. |
| `phone` | `VARCHAR(50)` | Nullable | Primary contact telephone/mobile number. |
| `avatar_url` | `VARCHAR(500)` | Nullable | Profile avatar image link. |
| `designation` | `VARCHAR(255)` | Nullable | Officer or Admin job title (e.g., 'Senior Review Officer'). |
| `department` | `VARCHAR(255)` | Nullable | Government department (e.g., 'AYUSH Registration Division'). |
| `assigned_states`| `TEXT[]` | Default `'{}'` | For officers: list of Indian states assigned for jurisdictional triage. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Account creation timestamp. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Last profile update timestamp. |

---

### 3.2 `startups` Table
Stores verified company background information captured during registration.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default `gen_random_uuid()` | Unique startup organization ID (e.g., `stp_001`). |
| `user_id` | `UUID` | **FK** to `users(id)`, **Unique**, Not Null | 1:1 owner link. Cascade on user deletion. |
| `legal_name` | `VARCHAR(255)` | Not Null | Registered legal entity name (e.g., 'VedaCure Wellness Pvt. Ltd.'). |
| `brand_name` | `VARCHAR(255)` | Not Null | Consumer-facing brand name (e.g., 'VedaCure'). |
| `incorporation_date`| `DATE` | Nullable | Date registered with Ministry of Corporate Affairs (MCA). |
| `incorporation_type`| `VARCHAR(100)` | Nullable | 'Private Limited', 'LLP', 'Registered Partnership', etc. |
| `registration_number`| `VARCHAR(100)` | Nullable | MCA CIN, LLPIN, or Registrar of Firms number. |
| `official_email` | `VARCHAR(255)` | Nullable | Official organizational email for notices. |
| `website` | `VARCHAR(255)` | Nullable | Corporate website URL. |
| `ayush_domain` | `VARCHAR(50)` | **FK** to `ayush_categories(code)`, Not Null | Primary AYUSH classification. |
| `business_activities`| `TEXT[]` | Default `'{}'` | Multi-select: ['Manufacturing', 'Healthcare Services', 'Tech']. |
| `description` | `TEXT` | Nullable | Comprehensive business and innovation overview ($\ge 50$ chars). |
| `products` | `TEXT` | Nullable | Description of products, therapies, or platforms offered. |
| `business_stage` | `VARCHAR(50)` | Nullable | 'Ideation', 'Validation', 'Early Stage', 'Growth', 'Scaling'. |
| `targetMarket` | `VARCHAR(255)` | Nullable | Target customer base and geographical markets. |
| `operational_status`| `VARCHAR(50)` | Default `'Active'` | 'Active', 'Pre-revenue', 'Dormant'. |
| `state` | `VARCHAR(100)` | Not Null | Registered state in India. |
| `city` | `VARCHAR(100)` | Nullable | City of registered office or production unit. |
| `dpiit_recognized` | `BOOLEAN` | Default `FALSE` | Startup India DPIIT recognition flag. |
| `dpiit_number` | `VARCHAR(100)` | Nullable | DPIIT Certificate identification number. |
| `existing_licences`| `TEXT[]` | Default `'{}'` | Existing certifications (e.g., ['GMP Certificate', 'FSSAI Licence']). |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Profile creation timestamp. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Last profile update timestamp. |

---

### 3.3 `founders` Table
Normalizes the founders and co-founders array from Step 1 of the application form.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default `gen_random_uuid()` | Unique founder identifier. |
| `startup_id` | `UUID` | **FK** to `startups(id)`, Not Null | Foreign key linking founder to startup. Cascade delete. |
| `name` | `VARCHAR(255)` | Not Null | Founder full legal name. |
| `designation` | `VARCHAR(100)` | Not Null | Corporate designation (e.g., 'CEO & Founder', 'CTO'). |
| `email` | `VARCHAR(255)` | Not Null | Founder personal contact email. |
| `phone` | `VARCHAR(50)` | Not Null | Founder contact mobile number. |
| `qualification` | `VARCHAR(255)` | Not Null | Scientific/professional qualification (e.g., 'BAMS', 'B.Tech AI'). |
| `is_primary` | `BOOLEAN` | Default `FALSE` | True for the primary applicant/founder. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Record timestamp. |

---

### 3.4 `ayush_categories` Table (Master Data)
Master registry for AYUSH streams, managed via `AdminCategories.jsx`.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `code` | `VARCHAR(50)` | **PK** | Identifier code (e.g., `'AYURVEDA'`, `'YOGA_NATUROPATHY'`). |
| `name` | `VARCHAR(100)` | **Unique**, Not Null | Display name (e.g., 'Ayurveda', 'Yoga & Naturopathy'). |
| `description` | `TEXT` | Nullable | Scope and description of domain. |
| `regulatory_authority`| `VARCHAR(255)` | Nullable | Governing board (e.g., 'Pharmacopoeia Commission for Indian Medicine'). |
| `is_active` | `BOOLEAN` | Default `TRUE` | Active flag for administrative enablement. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Master creation timestamp. |

---

### 3.5 `document_types` Table (Master Data)
Master registry defining required document types and upload constraints.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `code` | `VARCHAR(50)` | **PK** | Identifier code (e.g., `'INCORPORATION_PROOF'`, `'DRUG_LICENCE'`). |
| `name` | `VARCHAR(255)` | Not Null | Descriptive document name (e.g., 'Certificate of Incorporation'). |
| `category` | `VARCHAR(50)` | Not Null | 'incorporation', 'regulatory', 'clinical', 'financial', 'other'. |
| `allowed_formats`| `VARCHAR(100)` | Default `'.pdf,.jpg,.jpeg,.png'` | Permitted MIME types/extensions. |
| `max_size_mb` | `INTEGER` | Default `5` | Maximum allowed file size in Megabytes. |
| `is_mandatory` | `BOOLEAN` | Default `FALSE` | Whether required for final submission. |

---

### 3.6 `applications` Table
The central workflow entity tracking individual registration submissions.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | **PK** | Tracking number (e.g., `'APP-2025-001'`). |
| `startup_id` | `UUID` | **FK** to `startups(id)`, Not Null | Startup filing this application. |
| `ayush_domain` | `VARCHAR(50)` | **FK** to `ayush_categories(code)`, Not Null | AYUSH discipline being applied under. |
| `status` | `VARCHAR(50)` | Not Null, Default `'Draft'` | `'Draft'`, `'Submitted'`, `'Under Review'`, `'Clarification Required'`, `'Resubmitted'`, `'Approved'`, `'Rejected'`. |
| `state` | `VARCHAR(100)` | Not Null | Jurisdiction state for regional triage. |
| `assigned_officer_id`| `UUID` | **FK** to `users(id)`, Nullable | Officer evaluating application. Set to NULL on officer deletion. |
| `regulatory_details`| `JSONB` | Default `'{}'` | Step 4 data: manufacturing facility, drug license numbers, clinical approvals. |
| `business_details_snapshot`| `JSONB` | Default `'{}'` | Immutable snapshot of business data at the time of submission. |
| `certificate_number`| `VARCHAR(100)` | **Unique**, Nullable | Formal AYUSH Certificate ID (e.g., `'AYUSH-REG-2025-0012'`). |
| `certificate_issued_at`| `TIMESTAMP WITH TIME ZONE` | Nullable | Timestamp when official certificate was generated. |
| `submitted_at` | `TIMESTAMP WITH TIME ZONE` | Nullable | Timestamp when applicant transitioned status from Draft to Submitted. |
| `last_updated` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Last status or data modification timestamp. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Application draft initialization timestamp. |

---

### 3.7 `documents` Table
Stores metadata, file URLs, and reviewer verification statuses for uploaded compliance documents.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default `gen_random_uuid()` | Unique document record ID. |
| `application_id` | `VARCHAR(50)` | **FK** to `applications(id)`, Nullable | Application the file belongs to (nullable for general startup repository). |
| `startup_id` | `UUID` | **FK** to `startups(id)`, Not Null | Startup owner of the file. |
| `document_type_code`| `VARCHAR(50)` | **FK** to `document_types(code)`, Nullable | Master classification code. |
| `name` | `VARCHAR(255)` | Not Null | User-visible file title (e.g., 'GMP Certification'). |
| `file_name` | `VARCHAR(255)` | Not Null | Stored file name (e.g., 'vedacure_gmp_cert.pdf'). |
| `file_url` | `VARCHAR(500)` | Not Null | Secure object storage path or URL. |
| `file_size` | `VARCHAR(50)` | Not Null | Human-readable size (e.g., '2.4 MB'). |
| `mime_type` | `VARCHAR(100)` | Default `'application/pdf'` | File MIME type for verification. |
| `status` | `VARCHAR(50)` | Default `'Uploaded'` | `'Uploaded'`, `'Pending Verification'`, `'Verified'`, `'Rejected'`. |
| `remark` | `TEXT` | Nullable | Officer note upon verification or rejection. |
| `verified_by_id` | `UUID` | **FK** to `users(id)`, Nullable | Officer who verified/rejected the document. |
| `verified_at` | `TIMESTAMP WITH TIME ZONE` | Nullable | Timestamp of officer document verification. |
| `uploaded_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Upload timestamp. |

---

### 3.8 `application_status_history` Table
Immutable audit trail tracking every transition of an application. Powers the frontend `<Timeline>` component.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default `gen_random_uuid()` | Unique timeline entry ID. |
| `application_id` | `VARCHAR(50)` | **FK** to `applications(id)`, Not Null | Target application. |
| `previous_status`| `VARCHAR(50)` | Nullable | Status prior to transition (NULL on initial 'Draft'). |
| `status` | `VARCHAR(50)` | Not Null | Status after transition (e.g., 'Submitted', 'Under Review'). |
| `remark` | `TEXT` | Not Null | Explanatory note or reviewer remarks. |
| `officer_name` | `VARCHAR(255)` | Nullable | Name of officer or system actor recording the event. |
| `actor_id` | `UUID` | **FK** to `users(id)`, Nullable | Foreign key of user triggering the transition. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Exact timestamp of the event. |

---

### 3.9 `clarification_queries` Table
Tracks clarification cycles raised during the `Clarification Required` state.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default `gen_random_uuid()` | Unique query identifier. |
| `application_id` | `VARCHAR(50)` | **FK** to `applications(id)`, Not Null | Application receiving clarification request. |
| `officer_id` | `UUID` | **FK** to `users(id)`, Not Null | Reviewer who raised the query. |
| `query_text` | `TEXT` | Not Null | Specific discrepancy or required documentation note. |
| `response_text` | `TEXT` | Nullable | Applicant's response text submitted upon resubmission. |
| `status` | `VARCHAR(50)` | Default `'Pending'` | `'Pending'` or `'Resolved'`. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Timestamp query was dispatched. |
| `resolved_at` | `TIMESTAMP WITH TIME ZONE` | Nullable | Timestamp applicant resubmitted response. |

---

### 3.10 `notifications` Table
Stores in-app notifications for startups, officers, and administrators.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default `gen_random_uuid()` | Unique notification ID. |
| `user_id` | `UUID` | **FK** to `users(id)`, Not Null | Recipient user ID. |
| `title` | `VARCHAR(255)` | Not Null | Notification header (e.g., 'Clarification Requested'). |
| `message` | `TEXT` | Not Null | Detailed notification message. |
| `type` | `VARCHAR(50)` | Default `'status_update'` | `'status_update'`, `'resubmission'`, `'system'`. |
| `application_id` | `VARCHAR(50)` | Nullable | Optional link to associated application. |
| `is_read` | `BOOLEAN` | Default `FALSE` | Read/unread flag. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Alert timestamp. |

---

### 3.11 `audit_logs` Table
Immutable log of system-wide administrative, security, and lifecycle actions for `AdminAuditLogs.jsx`.

| Attribute Name | Data Type | Constraints | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default `gen_random_uuid()` | Unique log identifier. |
| `actor_id` | `UUID` | **FK** to `users(id)`, Nullable | User executing the action (NULL if deleted or system). |
| `actor_name` | `VARCHAR(255)` | Not Null | Name of actor at the time of the action. |
| `actor_role` | `VARCHAR(50)` | Not Null | Role at time of action (`'startup'`, `'officer'`, `'admin'`). |
| `action` | `VARCHAR(255)` | Not Null | Event name (e.g., 'Application Approved', 'Reviewer Assigned'). |
| `target_entity` | `VARCHAR(100)` | Not Null | Affected entity type ('Application', 'Document', 'User'). |
| `target_id` | `VARCHAR(100)` | Not Null | Affected entity ID (e.g., 'APP-2025-001'). |
| `details` | `TEXT` | Not Null | Contextual details or diff notes. |
| `ip_address` | `VARCHAR(50)` | Nullable | Client IP address for security audits. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Default `CURRENT_TIMESTAMP` | Event timestamp. |

---

## 4. Key Database Design Decisions

1. **Hybrid Relational + JSONB Approach for Multi-Step Form**:
   - Structured columns (`legal_name`, `ayush_domain`, `status`, `state`) are strictly typed in relational columns for fast indexing, filtering, and foreign key integrity.
   - Dynamic, domain-specific regulatory answers (Step 4 questions that vary depending on whether the venture involves manufacturing, clinical establishments, or herbal pharmaceuticals) are captured in `regulatory_details (JSONB)`. This prevents bloated tables with dozens of sparse columns while preserving schema flexibility.
2. **Third Normal Form (3NF) Separation**:
   - `founders` are decoupled from `startups`, avoiding arrays of structured data and enabling individual verification of founder qualifications.
   - Master data (`ayush_categories`, `document_types`) are decoupled from transaction tables, enabling central administrative configuration.
3. **Optimized Indexing Strategy**:
   - `applications(status)`: Accelerates officer review queue filtering.
   - `applications(startup_id)`: Fast loading of startup applicant dashboard.
   - `applications(assigned_officer_id)`: Rapid assignment triage for reviewers.
   - `documents(application_id)`: Fast document listing during evaluation.
   - `notifications(user_id, is_read)`: Instant unread badge count calculation.
   - `audit_logs(created_at DESC)`: High-performance paginated audit log queries.

---

## 5. PostgreSQL Implementation & Verification (Phase 2, Chunk 2)

The relational schema has been implemented in PostgreSQL SQL scripts located in the root `database/` directory:
- **`database/schema.sql`**: Production DDL creating all 11 tables with explicit primary keys (`UUID` / `VARCHAR`), foreign keys with cascade rules, NOT NULL, UNIQUE, CHECK constraints, and 16 performance indexes.
- **`database/seed.sql`**: Sample data script providing verified data across all 11 tables matching the frontend demo logins (`startup@ayushsetu.demo`, `officer@ayushsetu.demo`, `admin@ayushsetu.demo` with bcrypt password hashes).
- **`database/queries.sql`**: Demonstrates CRUD, multi-table JOINs, GROUP BY aggregations, CTEs, subqueries, and ACID transactions.
- **`database/README.md`**: Complete execution instructions and verification guide.

### Implemented Table Structure Summary

| Table | Primary Key | Foreign Keys | Key Constraints & Indexes |
| :--- | :--- | :--- | :--- |
| `users` | `id (UUID)` | None | `CHECK (role IN ('startup','officer','admin'))`, `UNIQUE(email)`, Index on `role` |
| `ayush_categories` | `code (VARCHAR)` | None | `UNIQUE(name)`, `is_active DEFAULT TRUE` |
| `document_types` | `code (VARCHAR)` | None | `CHECK (category IN (...))`, `CHECK (max_size_mb > 0)` |
| `startups` | `id (UUID)` | `user_id` $\rightarrow$ `users(id)`<br>`ayush_domain` $\rightarrow$ `ayush_categories(code)` | `UNIQUE(user_id)`, Indexes on `user_id`, `ayush_domain` |
| `founders` | `id (UUID)` | `startup_id` $\rightarrow$ `startups(id)` | Index on `startup_id` |
| `applications` | `id (VARCHAR)` | `startup_id` $\rightarrow$ `startups(id)`<br>`ayush_domain` $\rightarrow$ `ayush_categories(code)`<br>`assigned_officer_id` $\rightarrow$ `users(id)` | `CHECK (status IN (...))`, `UNIQUE(certificate_number)`, Indexes on `status`, `startup_id`, `assigned_officer_id`, `ayush_domain` |
| `documents` | `id (UUID)` | `application_id` $\rightarrow$ `applications(id)`<br>`startup_id` $\rightarrow$ `startups(id)`<br>`document_type_code` $\rightarrow$ `document_types(code)`<br>`verified_by_id` $\rightarrow$ `users(id)` | `CHECK (status IN (...))`, Indexes on `application_id`, `startup_id`, `status` |
| `application_status_history` | `id (UUID)` | `application_id` $\rightarrow$ `applications(id)`<br>`actor_id` $\rightarrow$ `users(id)` | `CHECK (status IN (...))`, Index on `(application_id, created_at)` |
| `clarification_queries` | `id (UUID)` | `application_id` $\rightarrow$ `applications(id)`<br>`officer_id` $\rightarrow$ `users(id)` | `CHECK (status IN ('Pending','Resolved'))`, Index on `application_id` |
| `notifications` | `id (UUID)` | `user_id` $\rightarrow$ `users(id)`<br>`application_id` $\rightarrow$ `applications(id)` | Composite index on `(user_id, is_read)` |
| `audit_logs` | `id (UUID)` | `actor_id` $\rightarrow$ `users(id)` | `CHECK (actor_role IN ('startup','officer','admin','system'))`, Index on `created_at DESC` |



# Entity-Relationship (ER) Diagram Specification

## 1. Overview

This document presents the complete **Entity-Relationship (ER) Diagram** for the **AYUSH Startup Registration Portal**. The data model is derived from the functional requirements and the actual frontend implementation (`frontend/src/pages/`, `frontend/src/context/`, and `frontend/src/data/mockData.js`).

The database is designed to run on **PostgreSQL**, adhering to Third Normal Form (3NF), ensuring referential integrity, eliminating data anomalies, and supporting multi-role application tracking, document verification, clarification cycles, and audit logging.

---

## 2. Complete Mermaid ER Diagram

```mermaid
erDiagram
    %% Core Identity & Profile Relationships
    USER ||--o| STARTUP : "registers / manages"
    USER ||--o{ APPLICATION : "assigned to review"
    USER ||--o{ APPLICATION_STATUS_HISTORY : "records decision in"
    USER ||--o{ CLARIFICATION_QUERY : "raises"
    USER ||--o{ DOCUMENT : "verifies"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "triggers"

    STARTUP ||--|{ FOUNDER : "has"
    STARTUP ||--o{ APPLICATION : "submits"
    STARTUP ||--o{ DOCUMENT : "owns"

    %% Master Data Categorization
    AYUSH_CATEGORY ||--o{ STARTUP : "classifies"
    AYUSH_CATEGORY ||--o{ APPLICATION : "categorizes"
    DOCUMENT_TYPE ||--o{ DOCUMENT : "defines type of"

    %% Application Workflow & Adjudication
    APPLICATION ||--|{ APPLICATION_STATUS_HISTORY : "tracks lifecycle"
    APPLICATION ||--o{ DOCUMENT : "contains"
    APPLICATION ||--o{ CLARIFICATION_QUERY : "receives"

    %% Entity Attributes & Keys
    USER {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role
        varchar phone
        varchar avatar_url
        varchar designation
        varchar department
        text assigned_states
        timestamp created_at
        timestamp updated_at
    }

    STARTUP {
        uuid id PK
        uuid user_id FK, UK
        varchar legal_name
        varchar brand_name
        date incorporation_date
        varchar incorporation_type
        varchar registration_number
        varchar official_email
        varchar website
        varchar ayush_domain FK
        text business_activities
        text description
        text products
        varchar business_stage
        varchar target_market
        varchar operational_status
        varchar state
        varchar city
        boolean dpiit_recognized
        varchar dpiit_number
        text existing_licences
        timestamp created_at
        timestamp updated_at
    }

    FOUNDER {
        uuid id PK
        uuid startup_id FK
        varchar name
        varchar designation
        varchar email
        varchar phone
        varchar qualification
        boolean is_primary
        timestamp created_at
    }

    AYUSH_CATEGORY {
        varchar code PK
        varchar name UK
        text description
        varchar regulatory_authority
        boolean is_active
        timestamp created_at
    }

    DOCUMENT_TYPE {
        varchar code PK
        varchar name
        varchar category
        varchar allowed_formats
        integer max_size_mb
        boolean is_mandatory
    }

    APPLICATION {
        varchar id PK
        uuid startup_id FK
        varchar ayush_domain FK
        varchar status
        varchar state
        uuid assigned_officer_id FK
        jsonb regulatory_details
        jsonb business_details_snapshot
        varchar certificate_number UK
        timestamp certificate_issued_at
        timestamp submitted_at
        timestamp last_updated
        timestamp created_at
    }

    DOCUMENT {
        uuid id PK
        varchar application_id FK
        uuid startup_id FK
        varchar document_type_code FK
        varchar name
        varchar file_name
        varchar file_url
        varchar file_size
        varchar mime_type
        varchar status
        text remark
        uuid verified_by_id FK
        timestamp verified_at
        timestamp uploaded_at
    }

    APPLICATION_STATUS_HISTORY {
        uuid id PK
        varchar application_id FK
        varchar status
        text remark
        varchar officer_name
        uuid actor_id FK
        timestamp created_at
    }

    CLARIFICATION_QUERY {
        uuid id PK
        varchar application_id FK
        uuid officer_id FK
        text query_text
        text response_text
        varchar status
        timestamp created_at
        timestamp resolved_at
    }

    NOTIFICATION {
        uuid id PK
        uuid user_id FK
        varchar title
        text message
        varchar type
        varchar application_id FK
        boolean is_read
        timestamp created_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid actor_id FK
        varchar actor_name
        varchar actor_role
        varchar action
        varchar target_entity
        varchar target_id
        text details
        varchar ip_address
        timestamp created_at
    }
```

---

## 3. Entity Relationships and Cardinalities

### 3.1 Core Authentication & Profile Relationships
1. **`USER` $\longleftrightarrow$ `STARTUP` (1 : 0..1)**
   - *Cardinality*: One-to-Optional-One.
   - *Description*: A user with the `startup` role creates and manages exactly one `STARTUP` profile. Users with `officer` or `admin` roles do not possess a startup profile.
   - *Foreign Key*: `STARTUP.user_id` $\rightarrow$ `USER.id` (`UNIQUE`, `NOT NULL`, `ON DELETE CASCADE`).

2. **`STARTUP` $\longleftrightarrow$ `FOUNDER` (1 : 1..N)**
   - *Cardinality*: One-to-Many (Mandatory at least one).
   - *Description*: Every startup must register at least one primary founder and can add up to three co-founders (as captured in Step 1 of the application form).
   - *Foreign Key*: `FOUNDER.startup_id` $\rightarrow$ `STARTUP.id` (`NOT NULL`, `ON DELETE CASCADE`).

### 3.2 Application Submission & Categorization Relationships
3. **`STARTUP` $\longleftrightarrow$ `APPLICATION` (1 : 0..N)**
   - *Cardinality*: One-to-Many.
   - *Description*: A registered startup can file one or more applications over time (e.g., initial recognition, subsequent renewals, or registrations in multiple AYUSH streams).
   - *Foreign Key*: `APPLICATION.startup_id` $\rightarrow$ `STARTUP.id` (`NOT NULL`, `ON DELETE CASCADE`).

4. **`AYUSH_CATEGORY` $\longleftrightarrow$ `STARTUP` & `APPLICATION` (1 : 0..N)**
   - *Cardinality*: One-to-Many.
   - *Description*: Master reference table defining the 5 statutory streams (Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homoeopathy). Both the startup profile and specific applications reference this table.
   - *Foreign Key*: `STARTUP.ayush_domain` and `APPLICATION.ayush_domain` $\rightarrow$ `AYUSH_CATEGORY.code`.

5. **`USER (Officer)` $\longleftrightarrow$ `APPLICATION` (0..1 : 0..N)**
   - *Cardinality*: Optional One-to-Many.
   - *Description*: An application in `Draft` or `Submitted` status initially has no assigned officer (`assigned_officer_id IS NULL`). When a reviewer opens or claims it (`Under Review`), the officer's `USER.id` is linked.
   - *Foreign Key*: `APPLICATION.assigned_officer_id` $\rightarrow$ `USER.id` (`NULLABLE`, `ON DELETE SET NULL`).

### 3.3 Document Management Relationships
6. **`APPLICATION` $\longleftrightarrow$ `DOCUMENT` (1 : 0..N)**
   - *Cardinality*: One-to-Many.
   - *Description*: An application contains mandatory and optional compliance documents.
   - *Foreign Key*: `DOCUMENT.application_id` $\rightarrow$ `APPLICATION.id` (`NULLABLE` for startup-level repository files, `ON DELETE CASCADE`).

7. **`STARTUP` $\longleftrightarrow$ `DOCUMENT` (1 : 0..N)**
   - *Cardinality*: One-to-Many.
   - *Description*: Enables the startup dashboard's document repository view (`/dashboard/documents`), preserving all uploaded documents across submissions.
   - *Foreign Key*: `DOCUMENT.startup_id` $\rightarrow$ `STARTUP.id` (`NOT NULL`, `ON DELETE CASCADE`).

8. **`DOCUMENT_TYPE` $\longleftrightarrow$ `DOCUMENT` (1 : 0..N)**
   - *Cardinality*: One-to-Many.
   - *Description*: Validates the category, maximum allowable size, and format of uploaded documents (incorporation, drug manufacturing license, lab report, etc.).
   - *Foreign Key*: `DOCUMENT.document_type_code` $\rightarrow$ `DOCUMENT_TYPE.code`.

9. **`USER (Officer)` $\longleftrightarrow$ `DOCUMENT` (0..1 : 0..N)**
   - *Cardinality*: Optional One-to-Many.
   - *Description*: When an officer marks a document as `Verified` or `Rejected`, the officer's ID is recorded for verification accountability.
   - *Foreign Key*: `DOCUMENT.verified_by_id` $\rightarrow$ `USER.id` (`NULLABLE`, `ON DELETE SET NULL`).

### 3.4 Status Tracking, Queries & Auditability
10. **`APPLICATION` $\longleftrightarrow$ `APPLICATION_STATUS_HISTORY` (1 : 1..N)**
    - *Cardinality*: One-to-Many (Append-only).
    - *Description*: Captures every status transition (`Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Clarification Required` $\rightarrow$ `Resubmitted` $\rightarrow$ `Approved` / `Rejected`) with officer remarks and timestamps. Powers the frontend `<Timeline>` component.
    - *Foreign Key*: `APPLICATION_STATUS_HISTORY.application_id` $\rightarrow$ `APPLICATION.id` (`NOT NULL`, `ON DELETE CASCADE`).

11. **`APPLICATION` $\longleftrightarrow$ `CLARIFICATION_QUERY` (1 : 0..N)**
    - *Cardinality*: One-to-Many.
    - *Description*: When an officer flags missing documents or claims, a query record is created. The applicant responds directly within this record during resubmission.
    - *Foreign Key*: `CLARIFICATION_QUERY.application_id` $\rightarrow$ `APPLICATION.id` (`NOT NULL`, `ON DELETE CASCADE`).

12. **`USER` $\longleftrightarrow$ `NOTIFICATION` (1 : 0..N)**
    - *Cardinality*: One-to-Many.
    - *Description*: In-app notifications sent to specific users regarding status changes, assigned applications, or clarification requests.
    - *Foreign Key*: `NOTIFICATION.user_id` $\rightarrow$ `USER.id` (`NOT NULL`, `ON DELETE CASCADE`).

13. **`USER` $\longleftrightarrow$ `AUDIT_LOG` (0..1 : 0..N)**
    - *Cardinality*: Optional One-to-Many.
    - *Description*: Records critical security, role, and administrative operations. If a user is deactivated or removed, the audit log preserves the historic actor name and ID (`ON DELETE SET NULL`).
    - *Foreign Key*: `AUDIT_LOG.actor_id` $\rightarrow$ `USER.id` (`NULLABLE`, `ON DELETE SET NULL`).

---

## 4. Key Diagram Observations & Design Rationale

1. **Separation of Startup Profile from Specific Applications**:
   - Company details (CIN, brand, incorporation date) are stored in `STARTUP`, whereas dynamic review data (submission date, status, assigned reviewer, certificate) are stored in `APPLICATION`. This allows startups to submit multiple applications over time without duplicate company profiles.
2. **Immutable Status History vs. Current Status**:
   - `APPLICATION.status` provides $O(1)$ fast lookups for reviewer queues and filtering.
   - `APPLICATION_STATUS_HISTORY` preserves an append-only timeline of every transition, matching the frontend's timeline view.
3. **Structured Query Management**:
   - Rather than burying reviewer queries in generic remarks, `CLARIFICATION_QUERY` explicitly tracks the query text, applicant response text, and resolution status across review iterations.


# Database Workflow and Data Flow Mapping

This document describes the intended data flow and transaction boundaries; rows and sequence steps not called out as live remain design mappings. The backend has auth, startup profile, core application, resources, and officer-review routes. Real auth flows, startup profile and application flows, and officer/admin queue, assignment, review-start, and decision actions are connected for API sessions. Demo application flows remain local. Document, clarification, and notification list/read workflows remain unconnected. The API contract is still a draft. See [implementation-status.md](./implementation-status.md).

## 1. Overview

This document defines how frontend actions, component state transitions, and user interactions map to database queries, transactions, and state mutations within the **AYUSH Startup Registration Portal**.

---

## 2. Frontend Feature to Database Entity Mapping

| Frontend View & Component | Relevant File | Read Operations (SELECT) | Write Operations (INSERT / UPDATE) |
| :--- | :--- | :--- | :--- |
| **Authentication & Profile** | `AuthContext.jsx`<br>`LoginPage.jsx`<br>`StartupProfile.jsx` | `users` (by email / id)<br>`startups` (by `user_id`)<br>`founders` (by `startup_id`) | **INSERT**: new user into `users`, new startup into `startups`<br>**UPDATE**: startup contact details |
| **Application Wizard (7 Steps)** | `NewApplication.jsx`<br>`ApplicationContext.jsx` | `ayush_categories` (master domains)<br>`document_types` (upload checklist) | **INSERT**: `applications` (`status = 'Draft'` or `'Submitted'`)<br>**INSERT**: `documents` records<br>**INSERT**: `application_status_history` (`'Application created'`) |
| **Applicant Dashboard & Tracking** | `StartupDashboard.jsx`<br>`ApplicationsList.jsx`<br>`ApplicationDetail.jsx` | `applications` (by `startup_id`)<br>`documents` (by `application_id`)<br>`application_status_history` (timeline)<br>`clarification_queries` (pending queries) | **UPDATE**: `applications` (`status = 'Resubmitted'`, `last_updated = NOW()`)<br>**INSERT**: `application_status_history`<br>**UPDATE**: `clarification_queries` (`response_text`) |
| **Document Management** | `DocumentManagement.jsx`<br>`FileUpload.jsx` | `documents` (by `startup_id` or `application_id`)<br>`document_types` | **INSERT**: new `documents`<br>**DELETE**: unverified draft documents |
| **Officer Review Desk** | `OfficerDashboard.jsx`<br>`OfficerApplications.jsx`<br>`OfficerApplicationReview.jsx` | `applications` (`status != 'Draft'`)<br>`startups` & `founders`<br>`documents`<br>`application_status_history` | **UPDATE**: `applications.status` (`'Under Review'`, `'Approved'`, `'Rejected'`, `'Clarification Required'`)<br>**UPDATE**: `documents.status` (`'Verified'`, `'Rejected'`)<br>**INSERT**: `clarification_queries`<br>**INSERT**: `application_status_history`<br>**INSERT**: `notifications` |
| **Admin Console & Audit Logs** | `AdminDashboard.jsx`<br>`AdminUsers.jsx`<br>`AdminOfficers.jsx`<br>`AdminAuditLogs.jsx` | `users`, `applications`, `audit_logs`<br>Aggregated `COUNT(*)` grouped by `ayush_domain`, `status`, and monthly date | **INSERT / UPDATE**: `users` (reviewer account provisioning)<br>**INSERT**: `audit_logs` |
| **Notification Center** | `NotificationContext.jsx`<br>`NotificationsPage.jsx` | `notifications` (`WHERE user_id = $1`) | **UPDATE**: `notifications.is_read = TRUE` |

---

## 3. Intended End-to-End Application Data Flow

The sequence diagram is the target workflow. For live startup accounts, the React application context consumes draft create/list/detail/update/submit endpoints; startup profile loading uses `/api/startups/me`. Officer/admin review queues, assignment, review start, and approve/reject actions are connected. File upload/verification and clarification workflows are not connected, and notification list/read APIs are not implemented.

```mermaid
sequenceDiagram
    autonumber
    actor Applicant as Startup Applicant
    participant UI as React Frontend
    participant API as Backend API
    participant DB as PostgreSQL Database
    actor Officer as Review Officer

    %% Draft & Submission
    Applicant->>UI: Fills Steps 0-4 (Company, Founders, Domain, Regulatory)
    Applicant->>UI: Uploads Documents (Step 5)
    UI->>API: Upload File Payload
    API->>DB: INSERT INTO documents (status: 'Uploaded')
    Applicant->>UI: Reviews & Accepts Declaration (Step 6)
    UI->>API: POST /api/applications (Submit)
    Note over API,DB: Database Transaction Begins
    API->>DB: INSERT INTO applications (id: 'APP-2025-XXX', status: 'Submitted')
    API->>DB: INSERT INTO application_status_history (status: 'Submitted', remark: 'Application submitted')
    API->>DB: INSERT INTO notifications (userId: applicant_id, title: 'Application Submitted')
    API->>DB: INSERT INTO audit_logs (action: 'Application Submitted')
    Note over API,DB: Transaction Committed
    API-->>UI: 201 Created (Tracking ID returned)

    %% Officer Evaluation
    Officer->>UI: Views Assigned Application Queue
    UI->>API: GET /api/officer/applications
    API->>DB: SELECT * FROM applications WHERE status != 'Draft'
    DB-->>API: Applications List
    Officer->>UI: Opens Application APP-2025-XXX
    UI->>API: PATCH /api/applications/:id/review
    API->>DB: UPDATE applications SET status = 'Under Review', assigned_officer_id = officer_id
    API->>DB: INSERT INTO application_status_history (status: 'Under Review')

    %% Verification & Query Cycle
    Officer->>UI: Verifies / Flags Individual Documents
    UI->>API: PATCH /api/documents/:id/verify
    API->>DB: UPDATE documents SET status = 'Verified' / 'Rejected', remark = $remark
    
    alt Discrepancy Found (Query Raised)
        Officer->>UI: Submits Query Notes
        UI->>API: POST /api/applications/:id/queries
        Note over API,DB: Transaction: Query Generation
        API->>DB: UPDATE applications SET status = 'Clarification Required'
        API->>DB: INSERT INTO clarification_queries (query_text, status: 'Pending')
        API->>DB: INSERT INTO application_status_history (status: 'Clarification Required')
        API->>DB: INSERT INTO notifications (userId: applicant_id, title: 'Clarification Requested')
        Note over API,DB: Committed
        
        %% Resubmission by Applicant
        Applicant->>UI: Opens Clarification Tab, types response, uploads new docs
        Applicant->>UI: Clicks "Resubmit Application"
        UI->>API: POST /api/applications/:id/submit
        Note over API,DB: Transaction: Resubmission
        API->>DB: UPDATE applications SET status = 'Resubmitted'
        API->>DB: UPDATE clarification_queries SET response_text = $response, resolved_at = NOW()
        API->>DB: INSERT INTO application_status_history (status: 'Resubmitted')
        API->>DB: INSERT INTO notifications (userId: officer_id, title: 'Application Resubmitted')
        Note over API,DB: Committed
    else Full Compliance Verified
        Officer->>UI: Approves Application with Remarks
        UI->>API: PATCH /api/applications/:id/decide (decision: APPROVED)
        Note over API,DB: Target transaction: record portal outcome
        API->>DB: UPDATE applications SET status = 'Approved'
        API->>DB: INSERT INTO application_status_history (status: 'Approved', remark: 'Application approved by portal reviewer')
        API->>DB: INSERT INTO notifications (userId: applicant_id, title: 'Application review outcome recorded')
        API->>DB: INSERT INTO audit_logs (action: 'Application Approved')
        Note over API,DB: Committed
    end
```

---

## 4. Document Verification Lifecycle Flow

Documents progress through specific statuses independent of, but contributing to, the overarching application status:

```mermaid
stateDiagram-v2
    [*] --> Uploaded : Applicant uploads document
    Uploaded --> Pending_Verification : Application transitioned to 'Submitted'
    Pending_Verification --> Verified : Reviewer confirms authenticity & legibility
    Pending_Verification --> Rejected : Reviewer flags unreadable / invalid file
    Rejected --> Uploaded : Applicant uploads revised document during Clarification
    Verified --> [*]
```

- When an application transitions to `Submitted`, linked documents move to `Pending Verification`.
- An application cannot transition to `Approved` if any mandatory document remains `Pending Verification` or `Rejected`.
- Rejected documents require replacement during the `Clarification Required` state.

---

## 5. ACID Transaction Boundaries & Invariants

To guarantee data consistency across concurrent requests:

1. **Submission Transaction**:
   - Status update (`Draft` $\rightarrow$ `Submitted`)
   - Linking uploaded documents to application tracking ID
   - Insertion of initial submission timeline record
   - Dispatch of confirmation notification
   - *Failure behavior*: Rollback entire transaction; application remains `Draft`.

2. **Clarification Query Transaction**:
   - Status update (`Under Review` $\rightarrow$ `Clarification Required`)
   - Insertion of record into `clarification_queries`
   - Insertion of query notice into `application_status_history`
   - Dispatch of urgent notification to startup user
   - *Failure behavior*: Rollback; status remains `Under Review`.

3. **Approval & Portal Outcome Transaction**:
   - Status update (`Under Review` $\rightarrow$ `Approved`)
   - Recording the reviewer decision and any agreed internal portal reference
   - Insertion of approval record into `application_status_history`
   - Insertion of system audit entry into `audit_logs`
   - *Failure behavior*: Rollback; no partial portal outcome is recorded.

---

## 6. SQL Query Examples

The following sections in [`database/queries.sql`](../database/queries.sql) illustrate the target transactions and query patterns. Their execution against a live database has not been verified in the current project state:
- **Submission Workflow**: Section 6.1 (`BEGIN ... UPDATE applications ... INSERT INTO application_status_history ... COMMIT;`).
- **Clarification Cycle**: Section 1.3 & 7.2 (`INSERT INTO clarification_queries ... UPDATE applications SET status = 'Clarification Required'`).
- **Adjudication & Portal Outcome**: Section 6.2 (Atomic approval transaction and audit log; any reference is internal and non-statutory).
- **Admin Dashboard Feed**: Section 8 (Aggregated monthly registration trends and domain distributions for Recharts).


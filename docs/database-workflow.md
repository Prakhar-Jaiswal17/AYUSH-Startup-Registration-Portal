# Database Workflow and Data Flow Mapping

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

## 3. End-to-End Application Data Flow

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
    UI->>API: GET /api/officers/assigned/applications
    API->>DB: SELECT * FROM applications WHERE status != 'Draft'
    DB-->>API: Applications List
    Officer->>UI: Opens Application APP-2025-XXX
    UI->>API: PATCH /api/applications/APP-2025-XXX/status (Under Review)
    API->>DB: UPDATE applications SET status = 'Under Review', assigned_officer_id = officer_id
    API->>DB: INSERT INTO application_status_history (status: 'Under Review')

    %% Verification & Query Cycle
    Officer->>UI: Verifies / Flags Individual Documents
    UI->>API: PATCH /api/documents/:id/verify
    API->>DB: UPDATE documents SET status = 'Verified' / 'Rejected', remark = $remark
    
    alt Discrepancy Found (Query Raised)
        Officer->>UI: Submits Query Notes
        UI->>API: POST /api/applications/APP-2025-XXX/clarify
        Note over API,DB: Transaction: Query Generation
        API->>DB: UPDATE applications SET status = 'Clarification Required'
        API->>DB: INSERT INTO clarification_queries (query_text, status: 'Pending')
        API->>DB: INSERT INTO application_status_history (status: 'Clarification Required')
        API->>DB: INSERT INTO notifications (userId: applicant_id, title: 'Clarification Requested')
        Note over API,DB: Committed
        
        %% Resubmission by Applicant
        Applicant->>UI: Opens Clarification Tab, types response, uploads new docs
        Applicant->>UI: Clicks "Resubmit Application"
        UI->>API: POST /api/applications/APP-2025-XXX/resubmit
        Note over API,DB: Transaction: Resubmission
        API->>DB: UPDATE applications SET status = 'Resubmitted'
        API->>DB: UPDATE clarification_queries SET response_text = $response, resolved_at = NOW()
        API->>DB: INSERT INTO application_status_history (status: 'Resubmitted')
        API->>DB: INSERT INTO notifications (userId: officer_id, title: 'Application Resubmitted')
        Note over API,DB: Committed
    else Full Compliance Verified
        Officer->>UI: Approves Application with Remarks
        UI->>API: PATCH /api/applications/APP-2025-XXX/status (Approved)
        Note over API,DB: Transaction: Final Approval
        API->>DB: UPDATE applications SET status = 'Approved', certificate_number = 'AYUSH-REG-2025-XXXX', certificate_issued_at = NOW()
        API->>DB: INSERT INTO application_status_history (status: 'Approved', remark: 'Application approved by Ministry')
        API->>DB: INSERT INTO notifications (userId: applicant_id, title: 'Application Approved! Certificate Issued')
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

3. **Approval & Certificate Generation Transaction**:
   - Status update (`Under Review` $\rightarrow$ `Approved`)
   - Generation and assignment of unique `certificate_number`
   - Setting `certificate_issued_at = CURRENT_TIMESTAMP`
   - Insertion of approval record into `application_status_history`
   - Insertion of system audit entry into `audit_logs`
   - *Failure behavior*: Rollback; no orphaned certificate number issued.

---

## 6. Implementation Reference (SQL Operations)

The transaction and workflow queries are fully implemented and verified in [`database/queries.sql`](../database/queries.sql):
- **Submission Workflow**: Section 6.1 (`BEGIN ... UPDATE applications ... INSERT INTO application_status_history ... COMMIT;`).
- **Clarification Cycle**: Section 1.3 & 7.2 (`INSERT INTO clarification_queries ... UPDATE applications SET status = 'Clarification Required'`).
- **Adjudication & Certification**: Section 6.2 (Atomic approval transaction assigning `certificate_number` and audit log).
- **Admin Dashboard Feed**: Section 8 (Aggregated monthly registration trends and domain distributions for Recharts).


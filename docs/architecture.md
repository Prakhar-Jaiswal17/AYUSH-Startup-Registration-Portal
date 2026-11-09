# High-Level System Architecture Specification

## 1. Architectural Overview

The **AYUSH Startup Registration Portal** follows a modern, modular **Three-Tier Architecture** consisting of the **Presentation Layer (React 19 / Vite Frontend)**, **Application / Business Logic Layer (Node.js / Express REST API)**, and **Data & Persistence Layer (PostgreSQL Database & Secure Object Storage)**. 

The design emphasizes separation of concerns, strict type safety, end-to-end security, and relational data integrity aligned with Advanced Software Development and DBMS engineering principles.

---

## 2. System Architecture Diagram

The diagram below illustrates the architectural layers, internal components, and communication pathways across the entire portal:

```mermaid
flowchart TD
    %% Client Tier
    subgraph ClientTier["Client / Presentation Tier"]
        Browser["Web Browser (Desktop / Mobile)"]
        UI_Applicant["Applicant Dashboard & Forms"]
        UI_Reviewer["Reviewer Evaluation Desk"]
        UI_Admin["Admin Management Console"]
    end

    %% Application / Server Tier
    subgraph AppTier["Application & Business Logic Tier (Next.js / Node.js)"]
        Middleware["Auth & RBAC Middleware (NextAuth.js)"]
        
        subgraph Controllers["API Routes & Server Actions"]
            AuthCtrl["Auth Controller"]
            AppCtrl["Application Controller"]
            DocCtrl["Document Controller"]
            ReviewCtrl["Review & Query Controller"]
            AdminCtrl["Admin & Analytics Controller"]
        end

        subgraph Services["Core Business Logic Services"]
            ValidationService["Schema Validation (Zod)"]
            WorkflowService["Application Lifecycle Engine"]
            NotificationService["Notification & Audit Logger"]
            CertService["Certificate Generation Engine"]
        end

        PrismaClient["Prisma ORM (Data Access Layer)"]
    end

    %% Data & Storage Tier
    subgraph DataTier["Data & Persistence Tier"]
        DB[(PostgreSQL Database)]
        DocStorage["File / Object Storage (Secure Documents)"]
    end

    %% Connections
    Browser --> UI_Applicant
    Browser --> UI_Reviewer
    Browser --> UI_Admin

    UI_Applicant -->|HTTPS / JSON| Middleware
    UI_Reviewer -->|HTTPS / JSON| Middleware
    UI_Admin -->|HTTPS / JSON| Middleware

    Middleware --> Controllers
    Controllers --> Services
    Services --> PrismaClient
    Services -->|Upload / Download Stream| DocStorage
    PrismaClient -->|SQL via Connection Pool| DB
```

---

## 3. Tier-by-Tier Architectural Breakdown

### 3.1 Presentation Layer (Frontend)
- **Framework**: React 19, Vite 6, Tailwind CSS v4, and React Router v7.
- **Responsibilities**:
  - Rendering responsive, accessible user interfaces following government visual standards.
  - Multi-step client-side form wizards with validation via React Hook Form and Zod schemas.
  - Interactive status timelines, document preview drawers, and Recharts analytics dashboards.
  - Role-based routing (`<ProtectedRoute>`) isolating Startup, Officer, and Admin paths.
- **Sub-systems**:
  - **Public Portal**: Informational landing page, AYUSH guidelines, eligibility checklists, and FAQs.
  - **Applicant Dashboard**: Profile management, 7-step application filing, document upload, query responses, and certificate download.
  - **Reviewer Desk**: Application queue, document inspection pane, query generation modal, and adjudication console.
  - **Admin Console**: Platform analytics, user/officer provisioning, master category rules, and audit log exports.

### 3.2 Business Logic & Application Layer (Backend)
- **Framework**: Node.js & Express REST API server running on port 5000.
- **Responsibilities & Communication**:
  - Exposes RESTful JSON endpoints grouped into domain routers (`/api/auth`, `/api/applications`, `/api/documents`, `/api/officers`, `/api/admin`, `/api/notifications`).
  - **Authentication & RBAC Middleware**: Verifies signed JSON Web Tokens (`Authorization: Bearer <token>`) and enforces role boundaries (`startup`, `officer`, `admin`) before controller execution.
  - **Validation Layer**: Validates incoming request payloads with Zod before database processing.
  - **Application Lifecycle Engine**: Enforces valid status transitions (`Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Clarification Required` $\rightarrow$ `Resubmitted` $\rightarrow$ `Approved` / `Rejected`).
  - **Document Service**: Validates file MIME types and size constraints ($\le 5\text{MB}$), generates secure signed storage links, and manages verification updates.
  - **Clarification & Query Service**: Manages bidirectional query notes between reviewers and applicants.
  - **Audit Logging Service**: Records every status transition, review action, and administrative operation.

### 3.3 Data & Persistence Layer (Database & Storage)
- **Relational Database**: PostgreSQL (Relational DBMS)
  - Stores all structured business entities (`users`, `startups`, `founders`, `ayush_categories`, `document_types`, `applications`, `documents`, `application_status_history`, `clarification_queries`, `notifications`, `audit_logs`).
  - Enforces relational constraints (foreign keys with `ON DELETE CASCADE` or `ON DELETE SET NULL`, non-null checks, unique indexes).
  - Handles concurrent requests using row-level locking, connection pooling, and strict ACID transactions.
- **Inter-Tier Communication**:
  - **Frontend $\longleftrightarrow$ Backend**: Asynchronous HTTP/HTTPS REST requests using Axios (`frontend/src/services/api.js`), exchanging JSON payloads. Form uploads use `multipart/form-data`.
  - **Backend $\longleftrightarrow$ Database**: Connection-pooled SQL connections via Prisma ORM client with parameterized queries preventing SQL injection.
- **Document / Object Storage**:
  - Encrypted file repository storing uploaded certificates, test reports, and pitch decks.
  - Avoids storing binary BLOBs inside the relational database, ensuring database performance and backup efficiency.

---

## 4. End-to-End Data Flow (Registration to Review)

The sequence diagram below illustrates the complete data flow during an application submission and subsequent reviewer evaluation:

```mermaid
sequenceDiagram
    autonumber
    actor Applicant as Startup Applicant
    participant UI as Frontend (Next.js)
    participant Server as Application Server (API/Action)
    participant Storage as Document Storage
    participant DB as PostgreSQL (via Prisma)
    actor Reviewer as Government Reviewer

    %% Application Submission
    Applicant->>UI: Fill Application & Attach Documents
    UI->>Server: Upload Files
    Server->>Storage: Store Encrypted Files
    Storage-->>Server: Return File URLs & Identifiers
    UI->>Server: Submit Application Payload
    Server->>Server: Validate Input Schema (Zod)
    Server->>DB: Begin Transaction (Create Application, Link Docs, Log Status 'SUBMITTED')
    DB-->>Server: Transaction Committed
    Server-->>UI: Return Success with Tracking Number
    UI-->>Applicant: Display Submission Confirmation

    %% Review Process
    Reviewer->>UI: Access Review Inbox
    UI->>Server: Fetch Pending Applications
    Server->>DB: Query Applications (Status: SUBMITTED)
    DB-->>Server: Return Application List
    Server-->>UI: Render Application Queue
    
    Reviewer->>UI: Open Application & Inspect Docs
    UI->>Server: Request Document Access
    Server->>Storage: Generate Secure Read URL
    Storage-->>UI: Stream Document for Viewing

    %% Adjudication
    alt Reviewer Approves
        Reviewer->>UI: Select 'Approve' with Remarks
        UI->>Server: Post Approval Action
        Server->>DB: Transaction: Set Status 'APPROVED', Create Certificate Record, Log History
        DB-->>Server: Committed
        Server-->>UI: Confirmation Displayed
    else Reviewer Raises Query
        Reviewer->>UI: Select 'Raise Query' with Specific Notes
        UI->>Server: Post Query Action
        Server->>DB: Transaction: Set Status 'QUERY_RAISED', Insert Query Record, Log History
        DB-->>Server: Committed
        Server-->>UI: Query Dispatched
    end
```

---

## 5. Security Architecture & Threat Mitigation

| Security Concern | Threat Vector | Mitigation Strategy in AYUSH Portal |
| :--- | :--- | :--- |
| **Authentication** | Credential stuffing, brute force | Passwords hashed using bcrypt ($\ge 10$ salt rounds); rate-limiting on login routes. |
| **Authorization** | Horizontal & vertical privilege escalation | Server-side role checks and tenant isolation; applicants can only read/write their own records. |
| **SQL Injection** | Malicious SQL inputs | Fully parameterized queries generated by Prisma ORM; direct string concatenation forbidden. |
| **Cross-Site Scripting (XSS)** | Malicious scripts in input fields | Auto-escaping in React; server-side sanitization of text areas with Zod schemas. |
| **Unauthorized File Access** | Direct access to confidential patents/formulas | Files stored in private buckets accessible only through time-limited signed URLs generated for authenticated sessions. |
| **Data Integrity** | Partial writes or corrupt application states | All state transitions, status updates, and certificate issuances wrapped in PostgreSQL ACID transactions. |

---

## 6. DBMS Alignment & Scalability Strategy

- **Relational Normalization**: The data schema is designed up to 3rd Normal Form (3NF) to minimize data redundancy while maintaining query efficiency.
- **Indexing Strategy**: Indexes placed on frequently queried fields:
  - `applications(status)` - for rapid filtering of reviewer queues.
  - `applications(user_id)` - for instant loading of applicant dashboard records.
  - `applications(ayush_stream)` - for stream-based official filtering and analytics.
  - `applications(tracking_number)` - unique B-tree index for tracking lookups.
- **Auditability**: Dedicated `status_history` table tracking all changes with timestamps, actor IDs, previous states, and subsequent states.


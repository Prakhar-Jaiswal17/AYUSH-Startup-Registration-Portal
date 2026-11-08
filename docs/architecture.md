# High-Level System Architecture Specification

## 1. Architectural Overview

The **AYUSH Startup Registration Portal** follows a modern, modular **Three-Tier Architecture** consisting of the **Presentation Layer**, **Application / Business Logic Layer**, and **Data & Persistence Layer**. 

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
- **Framework**: Next.js (React 19/18) utilizing App Router architecture.
- **Responsibilities**:
  - Rendering responsive, accessible user interfaces.
  - Multi-step client-side form wizards with client validation via React Hook Form and Zod.
  - Asynchronous status updates and interactive timeline visualizers.
  - Secure document preview and file upload progress management.
- **Sub-systems**:
  - **Public Portal**: Information pages, AYUSH guidelines, eligibility checklists, and FAQs.
  - **Applicant Dashboard**: Profile management, application filing, query responses, and certificate download.
  - **Reviewer Desk**: Application inbox, document verification pane, query creation panel, and decision console.
  - **Admin Console**: User management, reviewer account creation, audit trails, and aggregate analytics.

### 3.2 Business Logic & Application Layer (Backend)
- **Framework**: Next.js Server Components, Server Actions, and Route Handlers.
- **Key Modules**:
  - **Authentication & RBAC Middleware**: Intercepts requests, validates JWT/session cookies, and rejects unauthorized role access before processing.
  - **Application Lifecycle Engine**: Enforces valid state transitions (`Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Query Raised` / `Approved` / `Rejected`).
  - **Document Service**: Manages upload stream validation (MIME-type detection, size boundaries) and generates secure signed URLs for document access.
  - **Query & Communication Module**: Manages back-and-forth remarks between reviewers and applicants.
  - **Certificate Engine**: Generates unique AYUSH Startup Registration IDs and verification tokens upon approval.
  - **Audit Logging Service**: Records every status transition, reviewer action, and administrative operation.

### 3.3 Data & Persistence Layer (Database & Storage)
- **Relational Database**: PostgreSQL
  - Stores all structured business entities (Users, Profiles, Applications, Queries, Review Notes, Status History, Certificates).
  - Enforces relational constraints (foreign keys, non-null constraints, unique indexes).
  - Handles concurrent requests using row-level locking and ACID transactions.
- **ORM / Query Abstraction**: Prisma ORM
  - Provides a single source of truth schema (`schema.prisma`).
  - Generates strongly-typed TypeScript queries, preventing SQL injection vulnerabilities.
  - Tracks schema changes via versioned migration scripts.
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


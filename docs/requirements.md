# Functional and Non-Functional Requirements Specification

## 1. Project Overview

The **AYUSH Startup Registration Portal** is a centralized digital platform developed to streamline, accelerate, and standardize the registration and regulatory compliance process for startups operating within the AYUSH sector (**A**yurveda, **Y**oga & Naturopathy, **U**nani, **S**iddha, and **H**omoeopathy).

These are target requirements for an academic application-processing portal, not a list of completed features. See [implementation-status.md](./implementation-status.md) for the current repository state. The portal records application outcomes; it does not issue statutory AYUSH licenses, regulatory approvals, or certifications with legal force.

Under the initiative of the Ministry of AYUSH and the All India Institute of Ayurveda (AIIA), this portal bridges the gap between emerging innovators, regulatory authorities, and administrative bodies. It addresses existing bottlenecks such as opaque manual paperwork, decentralized workflows, delayed verifications, and fragmented tracking mechanisms.

---

## 2. Project Objectives

- **Digitize and Centralize Registration**: Replace offline and fragmented registration processes with a single-window digital registration portal.
- **Enhance Regulatory Transparency**: Provide real-time visibility into the review lifecycle, guidelines, verification standards, and query resolution.
- **Accelerate Turnaround Time**: Implement structured reviewer assignment, standardized review stages, and dynamic query-raising workflows.
- **Ensure Data Integrity & Security**: Safeguard proprietary startup formulations, intellectual property (IP), and business documentation using robust role-based access control (RBAC) and encryption.
- **Support Sectoral Analytics**: Enable government officials and administrators to analyze startup distribution across AYUSH disciplines, regions, and innovation categories.

---

## 3. Project Scope & MVP Boundaries

To deliver a reliable and maintainable system within the timeline of the Advanced Software Development (ASD) and Database Management Systems (DBMS) curriculum, the scope is divided into **Minimum Viable Product (MVP)** and **Post-MVP Enhancements**.

### 3.1 Minimum Viable Product (MVP) - Core Features
1. **User Authentication & RBAC**: Secure signup, login, and session management for three roles: *Startup Applicant*, *Government Official / Reviewer*, and *Administrator*.
2. **Startup Registration & Profile Submission**: Comprehensive multi-step form capturing company details, AYUSH discipline, directors/partners, and product/service descriptions.
3. **Document Upload & Management**: Secure uploading, validation (file size, format), and viewing of mandatory compliance documents (e.g., Certificate of Incorporation, AYUSH drug license/testing reports, GST/PAN).
4. **Review & Decision Workflow**: Reviewer dashboard to inspect applications, verify attached documents, approve, reject with remarks, or raise queries.
5. **Clarification & Query Handling**: Bidirectional communication channel allowing reviewers to flag specific issues and applicants to submit corrected documents or responses.
6. **Real-time Status Tracking & History**: An interactive timeline showing the exact status of an application (`Draft`, `Submitted`, `Under Review`, `Query Raised`, `Resubmitted`, `Approved`, `Rejected`).
7. **Basic Admin Oversight**: User management and basic dashboard metrics (total applications, approved, pending, rejected).

### 3.2 Post-MVP / Additional Features (Future Scope)
- Automated Aadhaar / DigiLocker integration for founder identity verification.
- Automated OCR and document authenticity verification.
- SMS gateway integration for multi-channel alerts (MVP will prioritize in-app and email-ready notifications).
- Integration with external intellectual property (patent) and clinical trial registries (CTRI).
- Advanced AI-assisted preliminary compliance scoring and duplicate detection.

---

## 4. Functional Requirements (FR)

### FR-1: User Management & Authentication
- **FR-1.1**: The system shall allow startup founders to self-register with email, password, mobile number, and company name.
- **FR-1.2**: The system shall authenticate users securely using encrypted credentials and provide token-based or cookie-based sessions.
- **FR-1.3**: The system shall enforce Role-Based Access Control (RBAC) across three distinct roles: *Startup Applicant*, *Government Official / Reviewer*, and *Administrator*.
- **FR-1.4**: The system shall allow users to update their profile and reset forgotten passwords securely.
- **FR-1.5**: Administrators shall be able to create, activate, or deactivate official reviewer accounts.

### FR-2: Startup Registration & Application Filing
- **FR-2.1**: The system shall provide a multi-section application form covering:
  - **Entity Details**: Legal name, trade name, DPIIT recognition number (optional), date of incorporation, corporate address, state, and pincode.
  - **AYUSH Category**: Primary and secondary domain selection (Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homoeopathy).
  - **Business & Innovation Profile**: Product/service summary, research stage (concept, prototype, clinical validation, market-ready), patent/IP details.
  - **Promoter / Director Details**: Name, DIN/PAN, email, phone number, and designation.
- **FR-2.2**: The system shall allow applicants to save applications as a `Draft` and resume completion at any time before final submission.
- **FR-2.3**: The system shall perform client-side and server-side validation on all fields before submission.
- **FR-2.4**: Upon submission, the system shall generate a unique immutable Application Tracking Number (e.g., `AYUSH-2024-XXXXX`).

### FR-3: Document Upload & Storage
- **FR-3.1**: The system shall provide document upload fields for required compliance files:
  - Certificate of Incorporation / Partnership Deed
  - PAN and GST Registration Certificates
  - Proof of Office / Manufacturing Facility Address
  - AYUSH Drug Manufacturing License / Ayush Formulation Blueprint (if applicable)
  - Laboratory / Quality Testing Reports / Clinical Trial Clearance (if applicable)
  - Pitch Deck / Product Brochure
- **FR-3.2**: The system shall restrict uploads to allowed formats (`.pdf`, `.jpg`, `.jpeg`, `.png`) and enforce file size constraints (max 5 MB per file).
- **FR-3.3**: The system shall store documents securely in dedicated storage and save verifiable file metadata and URLs in the database.
- **FR-3.4**: Reviewers and applicants shall be able to preview and download uploaded files securely.

### FR-4: Application Review & Verification Workflow
- **FR-4.1**: The system shall display a prioritized queue of submitted applications for Government Reviewers.
- **FR-4.2**: Reviewers shall be able to open an application, view all entered data, and inspect attached documents side-by-side.
- **FR-4.3**: Reviewers shall be able to change application status to:
  - `Under Review`: Reviewer has started evaluation.
  - `Approved`: Application meets the portal's application review criteria. This outcome is not a statutory license or regulatory approval.
  - `Rejected`: Application fails compliance criteria (rejection reason mandatory).
  - `Query Raised`: Discrepancies or missing information flagged (detailed notes mandatory).

### FR-5: Query Management & Resubmission
- **FR-5.1**: Reviewers shall be able to raise queries detailing specific discrepancies and indicating required corrective actions or documents.
- **FR-5.2**: The applicant shall receive an immediate status update when a query is raised.
- **FR-5.3**: The applicant shall be provided an interface to write an explanatory response and upload replacement or supplementary documents.
- **FR-5.4**: Upon applicant resubmission, the application status shall transition to `Resubmitted` and return to the reviewer's queue with a complete audit trail.

### FR-6: Status Tracking, Notifications & Portal Acknowledgement
- **FR-6.1**: The applicant dashboard shall provide a live visual progress bar and timeline displaying all status changes and timestamps.
- **FR-6.2**: The system shall record status history in an audit trail table (previous status, new status, changed by, timestamp, comments).
- **FR-6.3**: Upon approval, the portal may record an internal application outcome or portal acknowledgement. Any reference number or document must be explicitly described as a portal record and must not imply statutory AYUSH licensing, regulatory approval, or government certification.
- **FR-6.4**: A downloadable portal acknowledgement may be added if included in the agreed project scope. It must not be presented as a statutory certificate.

### FR-7: Administrative Oversight & Analytics
- **FR-7.1**: Administrators shall have access to aggregated metrics:
  - Total registrations by AYUSH stream (Ayurveda, Yoga, Unani, Siddha, Homoeopathy).
  - Application status distribution (Draft, Submitted, Under Review, Approved, Rejected).
  - Average processing and turnaround time per reviewer.
- **FR-7.2**: Administrators shall be able to search and filter applications by date, stream, state, and status.
- **FR-7.3**: Administrators shall have access to system audit logs for critical actions (approvals, rejections, role assignments).

---

## 5. Non-Functional Requirements (NFR)

### NFR-1: Security & Confidentiality
- **Authentication Security**: Passwords must be hashed using strong cryptographic algorithms (bcrypt with salt rounds $\ge 10$).
- **Data Protection in Transit**: All communications between browser, server, and storage must be encrypted via TLS 1.3 / HTTPS.
- **Data Protection at Rest**: Sensitive database records and uploaded files must reside in secure storage with restricted direct access.
- **Role-Based Authorization (RBAC)**: APIs and server actions must validate session authenticity and role permissions on every request.
- **Input Sanitization & Injection Prevention**: All user inputs must be validated with strict schemas (e.g., Zod) and parameterized database queries (via Prisma ORM) to prevent SQL injection and Cross-Site Scripting (XSS).

### NFR-2: Usability & Accessibility
- **Intuitive UI Design**: Clean and responsive layout built with accessible components, following government web design principles and WCAG 2.1 AA accessibility guidelines.
- **Progressive Forms**: Multi-step wizard layout preventing cognitive overload, with clear inline validations, explanatory tooltips, and persistent autosave drafts.
- **Cross-Platform Compatibility**: Fully functional and responsive across mobile, tablet, and desktop viewports.

### NFR-3: Performance & Scalability
- **Page Response Times**: Page load times should remain under 2 seconds on standard broadband connections.
- **API Latency**: Common read/write API operations should respond within 300 ms under typical academic/demo workloads.
- **Stateless Application Tier**: Modular backend architecture allowing horizontal scaling of server instances.
- **Database Optimization**: Strategic indexing on foreign keys, status fields, user IDs, and application tracking numbers.

### NFR-4: Reliability & Data Integrity
- **ACID Transactions**: Critical state transitions (e.g., approving an application and generating a certificate record) must execute within database transactions.
- **Zero Document Loss**: Document metadata and file references must remain synchronized; orphan files should be cleaned up safely.
- **Audit Logging**: All reviewer actions, approvals, rejections, and queries must be permanently recorded with immutable timestamps and user IDs.

### NFR-5: Maintainability & Extensibility
- **Clean Architecture**: Clear separation between UI components, business logic services, and database data-access layers.
- **Maintainable JavaScript**: Use JavaScript consistently in the frontend and backend, with server-side validation and Prisma for database access.
- **Self-Documenting Code**: Standardized naming conventions, explicit schema validations, and modular folder structure.


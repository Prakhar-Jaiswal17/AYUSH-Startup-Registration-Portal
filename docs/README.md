# Project Documentation Index

This directory serves as the centralized documentation repository for the **AYUSH Startup Registration Portal**, developed as part of the **Advanced Software Development (ASD)** and **Database Management Systems (DBMS)** curriculum.

---

## 📑 Documentation Structure

```text
docs/
├── README.md                  # Master documentation index (this file)
│
├── requirements.md            # [Phase 1] Functional & Non-Functional Requirements & MVP Scope
├── user-roles.md              # [Phase 1] Roles, RBAC Permissions Matrix & Use-Case Diagram
├── application-workflow.md    # [Phase 1] Application Lifecycle & State Transitions
├── tech-stack.md              # [Phase 1] Technology Stack Specification & Academic Justification
├── architecture.md            # [Phase 1 & 2] High-Level 3-Tier System Architecture & Communication
│
├── ER-diagram.md              # [Phase 2] Mermaid Entity-Relationship Diagram & Cardinalities
├── database-design.md         # [Phase 2] Relational Schema Design, Attributes, Keys & 3NF Normalization
├── database-workflow.md       # [Phase 2] Frontend-to-Database Mapping & Transaction Boundaries
│
└── api-contract.md            # [Phase 2 Chunk 3] Agreed HTTP API Contract for frontend-backend integration
```

---

## 📌 Phase 1: Requirement Analysis & Project Setup

| Document | Description |
| :--- | :--- |
| **[`requirements.md`](./requirements.md)** | Core objectives, Ministry of AYUSH & AIIA context, functional requirements (FR-1 to FR-7), non-functional requirements (security, scalability, usability), and MVP vs. future scope. |
| **[`user-roles.md`](./user-roles.md)** | Detailed role specifications (*Startup Applicant*, *Government Reviewer*, *Administrator*), Role-Based Access Control (RBAC) matrix, and Mermaid Use-Case diagram. |
| **[`application-workflow.md`](./application-workflow.md)** | Complete end-to-end registration lifecycle, state transition machine (`Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Clarification Required` $\rightarrow$ `Resubmitted` $\rightarrow$ `Approved` / `Rejected`), and workflow flowchart. |
| **[`tech-stack.md`](./tech-stack.md)** | Selected technologies (React 19, Vite, Tailwind CSS v4, Node.js/Express, PostgreSQL, Prisma ORM) and their academic and architectural justifications. |
| **[`architecture.md`](./architecture.md)** | High-level 3-tier system architecture, tier-by-tier component interactions, inter-tier communication protocols, and security threat mitigations. |

---

## 🗄️ Phase 2 — Chunk 1: Database Analysis & ER Design

| Document | Description |
| :--- | :--- |
| **[`ER-diagram.md`](./ER-diagram.md)** | Complete Mermaid ER diagram showing all 11 finalized database entities, primary and foreign keys, relationship cardinalities (1:1, 1:N), and optional vs. mandatory constraints. |
| **[`database-design.md`](./database-design.md)** | Comprehensive 3NF relational database specification. Details entity attributes, suggested PostgreSQL data types, primary and foreign keys, candidate entity rationalization, and design decisions. |
| **[`database-workflow.md`](./database-workflow.md)** | Concrete mapping of React frontend views and context states to database operations, sequence diagrams of the review and clarification cycle, document verification state machine, and ACID transaction boundaries. |

---

## ⚙️ Phase 2 — Chunk 2: Relational Schema & PostgreSQL Implementation

The operational PostgreSQL database implementation files reside in the root [`database/`](../database) directory:

| File | Description |
| :--- | :--- |
| **[`database/schema.sql`](../database/schema.sql)** | Complete PostgreSQL DDL script creating all 11 tables, UUID primary keys, foreign keys with cascade/restrict rules, CHECK constraints, and 16 B-Tree performance indexes. |
| **[`database/seed.sql`](../database/seed.sql)** | Realistic fictional seed records populating all 11 tables matching frontend demo logins (bcrypt hashed passwords), applications across diverse statuses, and sample documents. |
| **[`database/queries.sql`](../database/queries.sql)** | Comprehensive SQL demonstration queries covering CRUD, multi-table INNER/LEFT JOINs, GROUP BY aggregations, CTEs, subqueries, ACID transactions, and Recharts analytics feeds. |
| **[`database/README.md`](../database/README.md)** | Setup guide, execution order, demo account credentials, and PostgreSQL execution verification. |

---

## 🔌 Phase 2 — Chunk 3: API Contract

| Document | Description |
| :--- | :--- |
| **[`api-contract.md`](./api-contract.md)** | Agreed HTTP API contract for frontend-backend integration. Defines base URL, JWT auth, shared enums (Role, ApplicationStatus), Prisma model names and key fields, route ownership table, all endpoint request/response shapes, error codes, frontend status label mapping, file upload spec, and team constraints. Must be agreed before parallel backend/frontend integration work begins. |



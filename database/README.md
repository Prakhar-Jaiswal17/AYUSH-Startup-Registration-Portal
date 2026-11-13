# AYUSH Startup Registration Portal - Database Implementation

This directory contains the production-grade PostgreSQL relational schema, seed data, and demonstration queries for the **AYUSH Startup Registration Portal** developed for the **Advanced Software Development (ASD)** and **Database Management Systems (DBMS)** project.

---

## 📁 Directory Structure

```text
database/
├── schema.sql    # DDL: Complete table definitions, foreign keys, constraints, and indexes
├── seed.sql      # DML: Realistic fictional sample data for all 11 entities matching frontend demo users
├── queries.sql   # SQL demonstration queries (CRUD, JOINs, Aggregates, CTEs, Transactions)
└── README.md     # Setup, execution instructions, and architectural explanations
```

---

## 🗄️ Implemented Relational Tables (11 Entities)

| Table Name | Primary Key | Foreign Keys | Purpose |
| :--- | :--- | :--- | :--- |
| `users` | `id (UUID)` | None | Authentication, RBAC (`startup`, `officer`, `admin`), profile data |
| `ayush_categories` | `code (VARCHAR)` | None | Master lookup for 5 statutory AYUSH streams |
| `document_types` | `code (VARCHAR)` | None | Master lookup for compliance document upload checklist |
| `startups` | `id (UUID)` | `user_id` $\rightarrow$ `users(id)` | Corporate profile data decoupled from single applications |
| `founders` | `id (UUID)` | `startup_id` $\rightarrow$ `startups(id)` | Normalized 1:N founders table (1NF compliance) |
| `applications` | `id (VARCHAR)` | `startup_id` $\rightarrow$ `startups(id)`<br>`ayush_domain` $\rightarrow$ `ayush_categories(code)`<br>`assigned_officer_id` $\rightarrow$ `users(id)` | Core workflow entity tracking submission lifecycle & certificate |
| `documents` | `id (UUID)` | `application_id` $\rightarrow$ `applications(id)`<br>`startup_id` $\rightarrow$ `startups(id)`<br>`document_type_code` $\rightarrow$ `document_types(code)`<br>`verified_by_id` $\rightarrow$ `users(id)` | Compliance documents with reviewer verification status & remarks |
| `application_status_history` | `id (UUID)` | `application_id` $\rightarrow$ `applications(id)`<br>`actor_id` $\rightarrow$ `users(id)` | Append-only status timeline tracking previous and new states |
| `clarification_queries` | `id (UUID)` | `application_id` $\rightarrow$ `applications(id)`<br>`officer_id` $\rightarrow$ `users(id)` | Clarification query cycle between reviewer and applicant |
| `notifications` | `id (UUID)` | `user_id` $\rightarrow$ `users(id)`<br>`application_id` $\rightarrow$ `applications(id)` | User-scoped notification alerts with read/unread tracking |
| `audit_logs` | `id (UUID)` | `actor_id` $\rightarrow$ `users(id)` | Immutable administrative and security audit trails |

---

## 🚀 Setup & Execution Guide

## Prisma integration (backend)

The PostgreSQL DDL in `schema.sql` is the source design. Its 11 tables are mapped in `backend/prisma/schema.prisma`; Prisma migrations are maintained under `backend/prisma/migrations/`. The Prisma models preserve the existing table/column names and key types. PostgreSQL `CHECK` constraints are represented in SQL migrations because Prisma Schema Language does not declare these checks.

From `backend/`, configure `DATABASE_URL` in the ignored `.env`, then use:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:status
npm run db:seed
```

`db:migrate` is for local development and applies pending migrations. Do not run `schema.sql` against a database containing data: that script drops and recreates its tables. For a fresh local database, either use the Prisma migrations or follow the SQL setup below; do not apply both schema-creation paths to the same database.

`db:seed` safely inserts any missing AYUSH category rows required by startup profiles and applications. It does not clear or replace existing data and does not create demo users. The standalone `seed.sql` below is for the SQL-script setup path and truncates existing tables; use it only on a disposable database.

### Prerequisites
- **PostgreSQL 14+** (Tested and verified on PostgreSQL 18.6).
- `psql` command-line utility.

### Step 1: Create Database
Connect to PostgreSQL and create the application database:
```bash
psql -U postgres -c "CREATE DATABASE ayush_portal;"
```
*(On macOS Homebrew, you can run `createdb ayush_portal` directly).*

### Step 2: Execute Schema Script (DDL)
Run `schema.sql` to create all 11 tables, constraints, and indexes:
```bash
psql -U postgres -d ayush_portal -f database/schema.sql
```

### Step 3: Execute Seed Script (Sample Data)
Populate the database with realistic sample records matching the React frontend demo logins:
```bash
psql -U postgres -d ayush_portal -f database/seed.sql
```

### Step 4: Run Demonstration Queries
Execute sample DBMS queries covering CRUD, JOINs, Aggregates, Transactions, and Analytics:
```bash
psql -U postgres -d ayush_portal -f database/queries.sql
```

---

## 🔐 Demo Credentials (Seeded)

All seeded demo accounts use the standard bcrypt password hash for `demo1234`:

| Role | Email | Password | Seeded Identity |
| :--- | :--- | :--- | :--- |
| **Startup** | `startup@ayushsetu.demo` | `demo1234` | Rajesh Kumar (VedaCure Wellness Pvt. Ltd.) |
| **Startup** | `ananya@yogaflow.demo` | `demo1234` | Ananya Singh (YogaFlow Technologies LLP) |
| **Officer** | `officer@ayushsetu.demo` | `demo1234` | Dr. Priya Sharma (Senior Review Officer) |
| **Officer** | `officer.verma@ayushsetu.demo` | `demo1234` | Dr. S. K. Verma (Technical Evaluation Officer) |
| **Admin** | `admin@ayushsetu.demo` | `demo1234` | Amit Verma (Platform Administrator) |

---

## 📐 Normalization & Integrity Guarantees

1. **First Normal Form (1NF)**:
   - Atomic column values throughout.
   - Multivalued attributes like founders are normalized into a dedicated `founders` table.
2. **Second Normal Form (2NF)**:
   - All non-key attributes are fully functionally dependent on the primary key.
   - Persistent company data (`startups`) is separated from individual filings (`applications`).
3. **Third Normal Form (3NF)**:
   - Zero transitive dependencies.
   - Master reference codes (`ayush_categories`, `document_types`) prevent data duplication across transaction tables.
   - Reviewer department and designation are stored in `users` and referenced by foreign key, not duplicated in `applications`.
4. **Hybrid Relational + JSONB Strategy**:
   - `regulatory_details` and `business_details_snapshot` in `applications` store variable Step 4 responses (varying by manufacturing vs. wellness vs. tele-health) without introducing dozens of sparse null columns.


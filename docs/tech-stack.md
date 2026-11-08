# Technology Stack Specification and Justification

## 1. Overview & Architectural Philosophy

The technology stack for the **AYUSH Startup Registration Portal** has been selected to meet the rigorous academic and practical demands of **Advanced Software Development (ASD)** and **Database Management Systems (DBMS)**. 

The core architectural tenets guiding our selection are:
- **Type Safety Across All Tiers**: Shared TypeScript types bridging the database, backend business logic, and frontend components.
- **Data Integrity & Relational Soundness**: Strict ACID transactions, foreign key constraints, and relational normalization.
- **Component Reusability & Maintainability**: Clean separation between presentation, controller/service logic, and persistence layers.
- **Developer Productivity & Scalability**: Zero-config compilation, rich ecosystem, and clear developer ergonomics.

---

## 2. Technology Stack Breakdown

| Layer | Selected Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (React)** | Modern full-stack React framework utilizing the App Router. Enables fast server-side rendering (SSR), static generation for public pages, client-side interactivity for dynamic multi-step forms, and zero-latency layout transitions. |
| **Language** | **TypeScript** | Enforces static typing across the entire codebase, eliminating runtime type errors, improving developer experience, and providing clean interface contracts. |
| **Styling & UI Library** | **Tailwind CSS + Shadcn UI** | Utility-first CSS framework combined with accessible, accessible-first (Radix UI) headless components. Enables rapid creation of clean, consistent, accessible, and responsive government-grade UI. |
| **Iconography** | **Lucide Icons** | Lightweight, clean, tree-shakeable icon set for modern UI status indicators and navigation elements. |
| **Form Handling & Validation** | **React Hook Form + Zod** | High-performance, un-controlled form state management with zero unnecessary re-renders. Paired with Zod for declarative schema validation shared across client and server. |
| **Backend & API Layer** | **Next.js API Routes & Server Actions** | Type-safe server endpoints and server actions executing server-side logic directly, minimizing boilerplate while keeping business logic modular and testable. |
| **Authentication & RBAC** | **NextAuth.js (Auth.js) / JWT** | Robust session and token management supporting secure cookie storage, CSRF protection, and role-based route middleware protection. |
| **Database Management System** | **PostgreSQL** | Enterprise-grade open-source Relational Database Management System (RDBMS). Guarantees full ACID compliance, strict referential integrity, JSONB support for dynamic metadata, robust indexing, and transaction support. |
| **Object-Relational Mapper (ORM)** | **Prisma ORM** | Type-safe database client and declarative schema modeling. Generates automatic TypeScript types from the database schema and manages reproducible database migrations. |
| **File / Document Storage** | **Local Storage (Dev) / Cloud Object Storage (Prod)** | Secure handling of uploaded regulatory documents (PDFs, images) using signed URLs to prevent unauthorized public access. |
| **Documentation & Diagramming** | **Markdown + Mermaid.js** | Living, code-managed documentation and diagrams natively rendered within GitHub, ensuring documentation stays versioned with source code. |

---

## 3. Detailed Component Justification

### 3.1 Frontend: Next.js, React & Tailwind CSS
- **Server Components & Client Components**: Next.js App Router allows static content (such as FAQs, guidelines, and homepages) to render on the server with zero JavaScript shipped to the client, while complex forms (application submission, review panels) utilize client components for real-time reactivity.
- **Responsive & Accessible Design**: Tailwind CSS ensures responsive layouts that render reliably across mobile, tablet, and desktop screens, compliant with standard web accessibility norms (WCAG 2.1 AA).
- **Form State Management**: The registration process involves multi-step data entry. `React Hook Form` handles form states efficiently, preserving draft states and validating field rules via `Zod` schemas before submission.

### 3.2 Backend: Next.js Server Architecture & Zod
- **Unified Full-Stack Repository**: Housing frontend and backend in a unified structure reduces deployment friction and eliminates API synchronization mismatches.
- **End-to-End Type Safety**: A Zod schema defined for an AYUSH application validates the applicant's input on the client before network transmission, and validates the exact same payload on the server before database persistence.
- **Middleware-Based Protection**: Next.js Middleware inspects incoming requests, decodes session tokens, and enforces role boundaries (e.g., verifying `role === 'REVIEWER'` for review routes) before executing any route handler.

### 3.3 Database & DBMS Alignment: PostgreSQL & Prisma ORM
- **Relational Integrity**: The AYUSH portal requires strict relationships: a Startup belongs to an Applicant; an Application has multiple Documents, multiple Status History entries, and multiple Queries. PostgreSQL enforces these relationships via foreign keys with `ON DELETE CASCADE` or `ON DELETE RESTRICT` constraints.
- **ACID Compliance**: Crucial operations (such as approving an application, generating a certificate ID, and recording the status audit log) must be executed atomically inside a database transaction to prevent partial state updates.
- **Prisma Schema & Migrations**: Prisma provides declarative schema definition (`schema.prisma`) that automatically tracks schema evolutions through migration files, ensuring all team members work against an identical database structure without manual SQL drift.

### 3.4 Security & Hashing
- **Bcrypt Password Hashing**: Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with a cost factor $\ge 10$.
- **Protection Against Top Vulnerabilities**:
  - **SQL Injection**: Eliminated through Prisma's parameterized queries.
  - **Cross-Site Scripting (XSS)**: Mitigated by React's built-in JSX escaping and sanitization.
  - **Cross-Site Request Forgery (CSRF)**: Prevented via SameSite cookie attributes and NextAuth token validation.

---

## 4. Development Environment & Tooling

- **Node.js**: LTS version (v20+ recommended) providing stable runtime execution.
- **Package Manager**: `npm` or `pnpm` for deterministic dependency resolution.
- **Version Control**: Git with GitHub for pull-request based peer review and branch management.
- **Linter & Code Formatter**: ESLint and Prettier to ensure uniform coding conventions across all team members.


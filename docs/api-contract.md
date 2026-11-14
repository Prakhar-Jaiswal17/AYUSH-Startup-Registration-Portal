# API Contract — AYUSH Startup Registration Portal

> **Document version:** 1.5 (draft — Prakhar's auth, startup, and startup-application route shapes reviewed against implementation; cross-owner review pending)
> **Phase:** Phase 2 — Chunk 4 (proposed API contract and team ownership)
> **Status:** Aligned to the existing PostgreSQL schema. The categories and read-only admin endpoints described below are implemented; Prakhar and Arnav should review the API fields together. Sarth has verified and aligned the resources contract and connected the public and startup resource pages. This draft does not change the SQL or Prisma schema.

This document is intended to be the source of truth for HTTP API communication between the React frontend and Express backend. Version 1.5 documents implemented categories and read-only admin routes. Prakhar checked the auth, startup profile, and startup application sections against the current backend; Arnav's cross-owner review is still needed before treating the full draft as final. See [team-roles.md](./team-roles.md) for the current division of project work.

---

## Table of Contents

1. [Base URL & Environment](#1-base-url--environment)
2. [Authentication](#2-authentication)
3. [Shared Enums](#3-shared-enums)
4. [Response Shape](#4-response-shape)
5. [Pagination Shape](#5-pagination-shape)
6. [Database Model Names & Key Fields](#6-database-model-names--key-fields)
7. [Route Ownership](#7-route-ownership)
8. [Auth Routes](#8-auth-routes)
9. [Startup Profile Routes](#9-startup-profile-routes)
10. [Application Routes — Startup-Facing](#10-application-routes--startup-facing)
11. [Document Routes](#11-document-routes)
12. [Clarification Query Routes](#12-clarification-query-routes)
13. [Officer Routes](#13-officer-routes)
14. [Notification Routes](#14-notification-routes)
15. [Admin Routes](#15-admin-routes)
16. [Resource Routes](#16-resource-routes)
17. [Error Codes](#17-error-codes)
18. [Frontend Status Label Mapping](#18-frontend-status-label-mapping)
19. [File Upload Specification](#19-file-upload-specification)
20. [Important Notes & Constraints](#20-important-notes--constraints)

---

## 1. Base URL & Environment

| Environment | Base URL |
| :--- | :--- |
| Local development | `http://localhost:3005/api` |
| Frontend env variable | `VITE_API_URL=http://localhost:3005/api` |

> **Current frontend status (14 November 2026):** `frontend/src/services/api.js` uses `VITE_API_URL` with the `http://localhost:3005/api` fallback, and `frontend/.env.example` contains the same value. No local `.env` file is required or committed.

Backend env variables required in `backend/.env`:

```
DATABASE_URL=...          # PostgreSQL connection string
JWT_SECRET=...            # Random 256-bit secret
PORT=3005
FRONTEND_ORIGIN=http://localhost:5173
```

`FRONTEND_ORIGIN` is the browser origin allowed by the Express CORS configuration.
Backend-issued JWT sessions expire exactly 30 days after login or registration; the server does not allow an environment override. After expiry, the user must sign in again.

---

## 2. Authentication

**Method:** JWT Bearer Token

- After login, the backend returns a `token` string.
- `AuthContext` stores the returned token in `localStorage` under `ayush_setu_token`; the API client attaches it to protected requests. Real login, registration, logout, and session restoration use the auth API. Demo role sign-in remains local.
- Every protected request must include the header:

```
Authorization: Bearer <token>
```

- The backend middleware (`middleware/auth.js`, owned by Prakhar) verifies the token and attaches `req.user` to the request object. The JWT claim and API response use the uppercase role values from Section 3; the middleware converts that role to lowercase for `req.user.role`, matching the database role value and backend role guards.

### `req.user` shape (set by auth middleware)

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "startup",
  "name": "Full Name"
}
```

---

## 3. Shared Enums

The HTTP API may use the stable uppercase values below. Before querying or writing PostgreSQL, the backend must translate them to the stored values in the mapping tables below. Prisma fields are strings; the database CHECK constraints accept only the stored values. Do not pass API enum values directly into Prisma.

### Role Enum

Used in API responses and JWT claims. The auth middleware normalizes the value to lowercase for internal `req.user.role`; store the lowercase representation in `users.role` and `audit_logs.actor_role`.
The database additionally permits `system` as an audit actor role; it is internal-only and is not a login/user role.

| API value | PostgreSQL value | Description |
| :--- | :--- | :--- |
| `STARTUP` | `startup` | Startup applicant user |
| `OFFICER` | `officer` | Government reviewer / AYUSH officer |
| `ADMIN` | `admin` | Portal administrator |

### Application Status Enum

Used in API bodies and query parameters. Store the title-case PostgreSQL value in `applications.status`, `application_status_history.status`, and `application_status_history.previous_status`.

| API value | PostgreSQL value | Frontend display label |
| :--- | :--- | :--- |
| `DRAFT` | `Draft` | Draft |
| `SUBMITTED` | `Submitted` | Submitted |
| `UNDER_REVIEW` | `Under Review` | Under Review |
| `QUERY_RAISED` | `Clarification Required` | Clarification Required |
| `RESUBMITTED` | `Resubmitted` | Resubmitted |
| `APPROVED` | `Approved` | Approved |
| `REJECTED` | `Rejected` | Rejected |

> **Rule:** Backend always sends and receives canonical SNAKE_CASE values. Frontend maps them to display labels for rendering only. See [Section 18](#18-frontend-status-label-mapping).

### Document Status Enum

| API value | PostgreSQL value | Description |
| :--- | :--- | :--- |
| `UPLOADED` | `Uploaded` | Uploaded and awaiting review |
| `PENDING_VERIFICATION` | `Pending Verification` | Explicitly queued for review |
| `VERIFIED` | `Verified` | Officer has verified the document |
| `REJECTED` | `Rejected` | Officer has rejected the document |

Clarification query `status` is `PENDING` or `RESOLVED` in the API and `Pending` or `Resolved` in PostgreSQL. Document type `category` is one of `incorporation`, `regulatory`, `clinical`, `financial`, or `other` in both API and database.

---

## 4. Response Shape

Business API responses use one of these two shapes. The current health check, `GET /api/health`, is an explicit exception and returns `{ "status": "OK" }`; confirm with the route owner whether to retain that shape or change the route to the common envelope.

### Success

```json
{
  "success": true,
  "data": { }
}
```

For list endpoints, `data` is an array. For paginated endpoints, see [Section 5](#5-pagination-shape).

### Error

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Validation errors (422) may include an optional `fields` object:

```json
{
  "success": false,
  "error": "Validation failed",
  "fields": {
    "email": "Invalid email format",
    "password": "Must be at least 8 characters"
  }
}
```

---

## 5. Pagination Shape

Endpoints that return lists support optional query params `page` (default `1`) and `limit` (default `10`, max `50`).

```json
{
  "success": true,
  "data": {
    "items": [ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

---

## 6. Database Model Names & Key Fields

These are the existing Prisma models and physical PostgreSQL fields. They are authoritative for persistence. API names shown in other sections are wire-format aliases only and must be mapped to these fields. Do not add columns or change keys to accommodate an API example.

### Physical models and API mapping

| Model | Database fields and constraints | API implications |
| :--- | :--- | :--- |
| `User` | UUID `id`; `email`, `passwordHash`, `fullName`, `role`, optional `phone`, `avatarUrl`, `designation`, `department`, `assignedStates`, timestamps. `role` stores lowercase values. | API `name` maps to `fullName`; `role` maps through Section 3. There is no `isActive` column, so account activation/deactivation is not supported by this schema. |
| `AyushCategory` | `code` is the primary key; `name` is unique; `description`, `regulatoryAuthority`, `isActive`, `createdAt`. | Use `categoryCode`/`ayushDomain` as the key, not a UUID `categoryId`. |
| `DocumentType` | `code` is the primary key; `name`, constrained `category`, comma-separated `allowedFormats`, positive `maxSizeMb`, `isMandatory`. | Use `documentTypeCode`; derive accepted extensions and max bytes from these fields. There is no UUID ID, description, allowed MIME type array, or per-file byte-limit column. |
| `Startup` | UUID `id`; unique `userId`; `legalName`, `brandName`, incorporation details, registration number, official email, website, `ayushDomain` FK to category code, arrays `businessActivities`/`existingLicences`, description/products/stage/market, operational status, state/city, DPIIT fields, timestamps. | One profile belongs to one user. Use `legalName` and `brandName` separately; do not infer one from the other. |
| `Founder` | UUID `id`; `startupId` FK; required name, designation, email, phone, qualification; `isPrimary`; `createdAt`. | Founders belong to the startup profile, not an application. No applicationId, DIN, or shareholding is stored. |
| `Application` | String `id` primary key in `APP-YYYY-NNN` format; `startupId`; `ayushDomain` FK to category code; stored status; required state; optional assigned officer; JSONB `regulatoryDetails` and `businessDetailsSnapshot`; legacy nullable certificate fields; submitted/created/lastUpdated timestamps. | `id` itself is the tracking number. Do not expose a UUID application id or create a second stored tracking-number field; an identical API alias is optional. Review/decision timestamps and officer remarks are not application columns; use status history for remarks/timing. |
| `Document` | UUID `id`; optional application FK; required startup FK; optional `documentTypeCode`; `name`, `fileName`, `fileUrl`, string `fileSize`, `mimeType`, stored status, remark, optional verifier/timestamp, `uploadedAt`. | No uploadedBy column. Store the byte count as a decimal string in `fileSize`; API `fileSizeBytes` is parsed from it. Map `documentTypeCode` to `document_type_code` and API document status to the stored title-case value. `fileUrl` must be a private storage reference and must not be returned as a public URL. |
| `ApplicationStatusHistory` | UUID `id`; application FK; nullable `previousStatus`; required `status`, `remark`; optional `officerName` and `actorId`; `createdAt`. | Use `status` (not `newStatus`) in persistence. Actor FK is nullable; `remark` is required. |
| `ClarificationQuery` | UUID `id`; application FK; required `officerId`, `queryText`; nullable `responseText`; stored `status` (`Pending`/`Resolved`); `createdAt`, nullable `resolvedAt`. | Map `applicantResponse` to `responseText`. There is no `responseSubmittedAt`; resolution time is distinct. |
| `Notification` | UUID `id`; `userId`; title/message/type; nullable `applicationId` (the formatted string key); `isRead`; `createdAt`. | Application references use the tracking-number string, not a UUID. |
| `AuditLog` | UUID `id`; nullable actor FK; required `actorName`, constrained `actorRole`, action, `targetEntity`, string `targetId`, text `details`, optional IP, `createdAt`. | Map `entityType`/`entityId`/`metadata` only if serialized into these existing fields. Do not assume a JSON metadata column. |

The following earlier contract fields have no persistence column and must not be treated as stored: `User.isActive`; application `reviewStartedAt`, `decidedAt`, and `officerRemarks`; founder `applicationId`, `dinNumber`, and `shareholding`; document `uploadedById`; query `responseSubmittedAt`; and all `Resource` records. The resource endpoints must serve static/configured content unless a future database change is agreed. `certificateNumber` is legacy data only and must never be represented as an AYUSH license, statutory approval, or government certification issued by this portal.

> **Tracking number generation:** The backend generates the `Application.id` in the database's required `APP-YYYY-NNN` format. The response may expose this same value as `id` and/or a convenience `trackingNumber` alias, but there is only one stored identifier. Use that string as the application ID in every route and foreign key.

---

## 7. Route Ownership

| Work area | Routes/files | Member |
| :--- | :--- | :--- |
| Shared Prisma client, authentication middleware, and JWT handling | Shared Prisma client module; `backend/src/middleware/auth.js` | **Prakhar** |
| Authentication APIs | `/api/auth/*` | **Prakhar** |
| Startup profile APIs | `/api/startups/*` | **Prakhar** |
| Startup application draft, read, update, and submit APIs | `/api/applications/*` (startup-facing) | **Prakhar** |
| Officer queue, assignment, review, and decision APIs | `/api/officer/*`, application assignment/review/decision routes | **Arnav** |
| Clarification-query APIs | `/api/applications/:id/queries`, `/api/queries/*` | **Arnav** |
| Notification APIs | `/api/notifications/*` | **Arnav** |
| Login, registration, startup profile/application, officer, admin-review, query, and notification screen integration | React pages and contexts | **Arnav** |
| Curated static resources and public resources page integration | `backend/src/routes/resources.js`, public resources page | **Sarth**; the endpoint already exists |
| Route registration in the Express server | `backend/src/server.js` | **Prakhar** |
| Document upload and verification APIs | `/api/applications/:id/documents`, `/api/documents/*` | **To be assigned** |
| AYUSH categories API and admin categories screen | `/api/categories`; `AdminCategories.jsx` | **Arnav** |
| Read-only admin analytics, user listing, audit logs, and screen integration | `GET /api/admin/analytics`, `/users`, `/audit-logs`; admin pages | **Arnav** |

### Route mounting in `server.js`

Prakhar maintains route registration in `backend/src/server.js`. The officer router is mounted at `/api/officer`; the category and read-only admin routers are mounted at `/api/categories` and `/api/admin`. Future route owners should coordinate route registration with Prakhar before adding route modules.

---

## 8. Auth Routes

### `POST /api/auth/register`

Register a new startup user account.

**Auth:** None

**Request body:**
```json
{
  "name": "Riya Sharma",
  "email": "riya@example.com",
  "password": "SecurePass@123",
  "phone": "9876543210"
}
```

**Success `201`:**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "name": "Riya Sharma",
      "email": "riya@example.com",
      "role": "STARTUP",
      "phone": "9876543210",
      "createdAt": "2026-11-14T10:30:00.000Z"
    }
  }
}
```

**Notes:**
- Role is always `STARTUP` on self-registration.
- Password must be at least 8 characters. Backend hashes with bcrypt before storing.
- Duplicate email → `409 Conflict`.

---

### `POST /api/auth/login`

**Auth:** None

**Request body:**
```json
{
  "email": "riya@example.com",
  "password": "SecurePass@123"
}
```

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "name": "Riya Sharma",
      "email": "riya@example.com",
      "role": "STARTUP",
      "phone": "9876543210",
      "createdAt": "2026-11-14T10:30:00.000Z"
    }
  }
}
```

**Errors:** `401` for invalid credentials. This schema has no account-active flag, so do not implement an `isActive` check.

---

### `GET /api/auth/profile`

Get the authenticated user's profile.

**Auth:** Required (any role)

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Riya Sharma",
    "email": "riya@example.com",
    "role": "STARTUP",
    "phone": "9876543210",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### `POST /api/auth/logout`

**Auth:** Required

**Success `200`:**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

> JWT is stateless; this endpoint exists for frontend UX and audit log purposes.

---

## 9. Startup Profile Routes

### `GET /api/startups/:id`

**Auth:** Required — `STARTUP` (own profile only) or `OFFICER` / `ADMIN`

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "legalName": "AyurTech Innovations Pvt. Ltd.",
    "brandName": "AyurTech",
    "registrationNumber": "U72900MH2024PTC123456",
    "incorporationDate": "2024-03-01T00:00:00.000Z",
    "website": "https://ayurtech.in",
    "description": "AI-powered Ayurveda diagnostics platform."
  }
}
```

---

### `PUT /api/startups/:id`

Update startup profile.

**Auth:** `STARTUP` (own profile only)

**Request body:** Any supported subset of startup fields, using schema names such as `legalName`, `brandName`, `registrationNumber`, `incorporationDate`, `website`, and `description`. AYUSH category references use the category `code`.

**Success `200`:** Updated startup object (same shape as GET above).

### `GET /api/startups/me` and `PUT /api/startups/me`

Convenience routes for the authenticated `STARTUP` user. `GET` returns that user's profile or `404` if it has not been created. `PUT` creates the profile on first use and updates it on later calls. Creating a profile requires `legalName`, `brandName`, `ayushDomain` (an active AYUSH category code), and `state`; optional `founders` replaces the startup's founder list in the same transaction. The `:id` routes remain available with the ownership rules above.

Self-registration creates a user account only. It does not invent company details or create a placeholder startup profile; applicants create their profile through this route or provide the required startup details when creating their first application.

---

## 10. Application Routes — Startup-Facing

### `POST /api/applications`

Create a new draft application.

**Auth:** `STARTUP`

**Request body:**
```json
{
  "categoryCode": "AYURVEDA",
  "state": "Maharashtra",
  "startupDetails": {
    "legalName": "AyurTech Innovations Pvt. Ltd.",
    "brandName": "AyurTech",
    "registrationNumber": "U72900MH2024PTC123456",
    "incorporationDate": "2024-03-01",
    "website": "https://ayurtech.in",
    "description": "AI-powered Ayurveda diagnostics."
  },
  "founders": [
    {
      "name": "Riya Sharma",
      "designation": "CEO & Co-founder",
      "email": "riya@ayurtech.in",
      "phone": "9876543210",
      "qualification": "BAMS",
      "isPrimary": true
    }
  ],
  "regulatoryInfo": {
    "dpiitRecognized": false,
    "gstNumber": "27AAAAA0000A1Z5",
    "panNumber": "AAAAA0000A",
    "msmeRegistered": true
  },
  "businessInfo": {
    "employeeCount": 12,
    "annualRevenue": 2500000,
    "fundingStage": "Seed",
    "targetMarket": "B2C healthcare consumers"
  }
}
```

`categoryCode` maps to the AYUSH category key. `startupDetails` and `founders` are persisted on the linked startup profile; `regulatoryInfo` maps to `Application.regulatoryDetails`, and `businessInfo` maps to `Application.businessDetailsSnapshot`. Founder records are not application-owned and must not include `dinNumber` or `shareholding` unless a schema change is agreed.

If the user has no startup profile yet, `startupDetails` must include `legalName`, `brandName`, and `state`, and `founders` must contain at least one founder. For an existing profile, supplied startup details and founders update that shared profile as part of draft creation; they are not an application-specific founder snapshot.

**Success `201`:**
```json
{
  "success": true,
  "data": {
    "id": "APP-2025-007",
    "trackingNumber": "APP-2025-007",
    "status": "DRAFT",
    "categoryCode": "AYURVEDA",
    "createdAt": "2025-11-11T10:00:00.000Z"
  }
}
```

> Backend generates `trackingNumber`. Frontend must display the returned value.

---

### `GET /api/applications`

List applications for the authenticated startup.

**Auth:** `STARTUP`

**Query params:** `status`, `page`, `limit`

**Success `200`:** Paginated list (see [Section 5](#5-pagination-shape)), each item:
```json
{
  "id": "APP-2025-007",
  "trackingNumber": "APP-2025-007",
  "status": "DRAFT",
  "legalName": "AyurTech Innovations Pvt. Ltd.",
  "categoryName": "Ayurveda",
  "submittedAt": null,
  "lastUpdated": "2025-11-11T10:00:00.000Z"
}
```

---

### `GET /api/applications/:id`

Get full application details.

**Auth:** `STARTUP` (own application), `OFFICER` (assigned applications only), or `ADMIN` (any application)

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": "APP-2025-007",
    "trackingNumber": "APP-2025-007",
    "status": "UNDER_REVIEW",
    "category": { "code": "AYURVEDA", "name": "Ayurveda" },
    "startup": { "id": "uuid", "legalName": "AyurTech Innovations Pvt. Ltd.", "brandName": "AyurTech" },
    "assignedOfficer": { "id": "uuid", "name": "Dr. Priya Nair" },
    "founders": [ { "name": "Riya Sharma", "designation": "CEO", "email": "riya@ayurtech.in" } ],
    "regulatoryInfo": { "dpiitRecognized": false, "gstNumber": "27AAAAA0000A1Z5" },
    "businessInfo": { "employeeCount": 12, "fundingStage": "Seed" },
    "documents": [ { "id": "uuid", "fileName": "pan_card.pdf", "status": "VERIFIED", "documentTypeCode": "PAN_CARD" } ],
    "statusHistory": [
      {
        "previousStatus": null,
        "status": "DRAFT",
        "remark": "Draft created",
        "changedBy": { "id": "uuid", "name": "Riya Sharma" },
        "createdAt": "2025-11-01T10:00:00.000Z"
      }
    ],
    "queries": [ ],
    "submittedAt": "2025-11-05T09:00:00.000Z",
    "lastUpdated": "2025-11-10T14:00:00.000Z"
  }
}
```

---

### `PUT /api/applications/:id`

Update a `DRAFT` or `QUERY_RAISED` application.

**Auth:** `STARTUP` (own application, only in `DRAFT` or `QUERY_RAISED` status)

**Request body:** Same optional fields as POST (partial update accepted).

**Success `200`:** Updated application object.

**Errors:** `403` if status is not `DRAFT` or `QUERY_RAISED`.

---

### `POST /api/applications/:id/submit`

Submit a draft application for review.

**Auth:** `STARTUP` (own, must be in `DRAFT` or `QUERY_RAISED` status)

**Request body:** None

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": "APP-2025-007",
    "trackingNumber": "APP-2025-007",
    "status": "SUBMITTED",
    "submittedAt": "2025-11-11T12:00:00.000Z"
  }
}
```

**Notes:**
- Status transitions: `DRAFT → SUBMITTED` or `QUERY_RAISED → RESUBMITTED`.
- Backend records entry in `application_status_history`.
- Backend creates a `Notification` for the startup.

---

### `GET /api/applications/:id/status-history`

**Auth:** `STARTUP` (own), `OFFICER`, `ADMIN`

**Success `200`:**
```json
{
  "success": true,
  "data": [
    {
      "previousStatus": null,
      "status": "DRAFT",
      "changedBy": { "id": "uuid", "name": "Riya Sharma" },
      "remark": "Draft created",
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

---

## 11. Document Routes

### `POST /api/applications/:id/documents`

Upload a document for an application.

**Auth:** `STARTUP` (own application, status must be `DRAFT` or `QUERY_RAISED`)

**Content-Type:** `multipart/form-data`

**Form fields:**
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | File | Yes | The document file |
| `documentTypeCode` | String | Yes | FK → `DocumentType.code` |

**Success `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileName": "pan_card.pdf",
    "mimeType": "application/pdf",
    "fileSizeBytes": 102400,
    "documentTypeName": "PAN Card",
    "documentTypeCode": "PAN_CARD",
    "status": "UPLOADED",
    "uploadedAt": "2025-11-11T12:00:00.000Z"
  }
}
```

**Errors:** `413` if file exceeds `maxSizeMb` for the document type. `415` if its extension is not listed in `allowedFormats` or its MIME type does not match the extension.

---

### `GET /api/applications/:id/documents`

**Auth:** `STARTUP` (own), `OFFICER`, `ADMIN`

**Success `200`:** Array of document objects (same shape as POST response).

---

### `PATCH /api/documents/:id/verify`

Officer verifies or rejects a document.

**Auth:** `OFFICER`, `ADMIN`

**Request body:**
```json
{
  "status": "VERIFIED",
  "remark": "Document is clear and valid."
}
```

API `status` maps to the stored document status; `remark` maps to `documents.remark`.

**Success `200`:** Updated document object. API `status` is translated to the stored value in `documents.status`.

---

### `DELETE /api/documents/:id`

Delete an uploaded document.

**Auth:** `STARTUP` (own, application must be `DRAFT` or `QUERY_RAISED`)

**Success `200`:**
```json
{
  "success": true,
  "data": { "message": "Document deleted successfully" }
}
```

---

## 12. Clarification Query Routes

### `POST /api/applications/:id/queries`

An assigned officer or ADMIN raises a clarification query while the application is `UNDER_REVIEW`. Status transitions to `QUERY_RAISED`.

**Auth:** `OFFICER`, `ADMIN`

**Request body:**
```json
{
  "queryText": "Please provide audited financial statements for FY 2023-24."
}
```

`queryText` must be non-empty and no more than 4000 characters.

**Success `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "applicationId": "APP-2025-007",
    "queryText": "Please provide audited financial statements for FY 2023-24.",
    "applicantResponse": null,
    "status": "PENDING",
    "isResolved": false,
    "createdAt": "2025-11-11T14:00:00.000Z",
    "resolvedAt": null
  }
}
```

**Notes:** Also updates `applications.status → QUERY_RAISED`, records status history and an audit event, and creates a status-update notification for the startup.

---

### `GET /api/applications/:id/queries`

List all clarification queries for an application.

**Auth:** `STARTUP` (own), `OFFICER` (assigned), `ADMIN`

**Success `200`:** Array of query objects including `applicationId`, `queryText`, `applicantResponse` (mapped from `responseText`), API `status` (`PENDING` or `RESOLVED`), `isResolved`, `createdAt`, and `resolvedAt`. The database does not store a response-submitted timestamp, so do not return `responseSubmittedAt`.

---

### `PATCH /api/queries/:id/respond`

Startup submits a response to a clarification query.

**Auth:** `STARTUP` (own application)

**Request body:**
```json
{
  "applicantResponse": "Attached audited financials for FY 2023-24 as requested."
}
```

`applicantResponse` must be non-empty and no more than 4000 characters. The query must still be `PENDING`, and the application must still be `QUERY_RAISED`.

**Success `200`:** Updated query object with `applicantResponse` set. The application stays `QUERY_RAISED` until the applicant uses `POST /api/applications/:id/submit` to resubmit it. The database does not store a response-submitted timestamp.

---

### `PATCH /api/queries/:id/resolve`

An assigned officer or ADMIN marks a query as resolved.

**Auth:** `OFFICER` (must be assigned to the application), `ADMIN`

**Request body:** None

The query must still be `PENDING`.

**Success `200`:** Updated query with API `status: "RESOLVED"` and `resolvedAt` set. `isResolved` is included as a compatibility alias. An audit event is recorded.

---

## 13. Officer Routes

### `GET /api/officer/applications`

Get all non-draft applications assigned to the authenticated officer, or all non-draft applications for ADMIN.

**Auth:** `OFFICER`, `ADMIN`

**Query params:** `status`, `categoryCode`, `page`, `limit`, `search` (startup legal name or tracking number)

**Success `200`:** Paginated reviewer queue. Drafts are excluded. Officers receive only applications assigned to their account; ADMIN receives all non-draft applications.

Each item includes `id`, `trackingNumber`, API `status`, `legalName`, `startupName`, `brandName`, `categoryCode`, `categoryName`, `state`, `assignedOfficer` (`{ id, name }` or `null`), `submittedAt`, `lastUpdated`, and `createdAt`.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "APP-2026-007",
        "trackingNumber": "APP-2026-007",
        "status": "SUBMITTED",
        "legalName": "AyurTech Innovations Pvt. Ltd.",
        "startupName": "AyurTech Innovations Pvt. Ltd.",
        "brandName": "AyurTech",
        "categoryCode": "AYURVEDA",
        "categoryName": "Ayurveda",
        "state": "Maharashtra",
        "assignedOfficer": { "id": "uuid", "name": "Dr. Priya Nair" },
        "submittedAt": "2026-11-14T10:00:00.000Z",
        "lastUpdated": "2026-11-14T10:00:00.000Z",
        "createdAt": "2026-11-12T09:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
}
```

`status` accepts the API values in Section 3. `categoryCode` must be an AYUSH category code. `search` matches an application tracking ID or startup legal name. `limit` is 1–50.

---

### `GET /api/officer/officers`

List officer accounts for the admin assignment control.

**Auth:** `ADMIN` only

**Success `200`:** Array of officer objects with `id`, `name`, `email`, `phone`, `designation`, `department`, `assignedStates`, and `createdAt`. The current schema has no account-activation field, so this endpoint returns users with role `officer` without an active/inactive filter.

---

### `PATCH /api/applications/:id/assign`

Assign an officer to an application.

**Auth:** `ADMIN` only

**Request body:**
```json
{
  "officerId": "uuid"
}
```

The selected user must have the `officer` role. Draft and final (`APPROVED`/`REJECTED`) applications cannot be assigned; submitted and in-progress applications can be reassigned.

**Success `200`:** Updated full application object as described in [Section 10 GET /api/applications/:id](#get-apiapplicationsid), with `assignedOfficer` populated.

---

### `PATCH /api/applications/:id/review`

Officer starts reviewing a submitted application. Status transitions to `UNDER_REVIEW`.

**Auth:** `OFFICER` (must be assigned officer), `ADMIN`

**Request body:** None

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": "APP-2025-007",
    "status": "UNDER_REVIEW"
  }
}
```

Only `SUBMITTED` or `RESUBMITTED` may enter `UNDER_REVIEW`. The actor must be the assigned officer unless the actor is ADMIN. The transition writes a status-history entry and audit event. The review start time can be derived from the matching history entry; it is not a separate application column.

---

### `PATCH /api/applications/:id/decide`

Officer approves or rejects an application.

**Auth:** `OFFICER` (must be assigned), `ADMIN`

**Request body:**
```json
{
  "decision": "APPROVED",
  "officerRemarks": "All documents verified. Application meets AYUSH criteria."
}
```

`remark` is saved to `application_status_history.remark`; the schema has no application-level officer remarks field.

| `decision` value | Resulting status |
| :--- | :--- |
| `APPROVED` | `APPROVED` |
| `REJECTED` | `REJECTED` |

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": "APP-2025-007",
    "trackingNumber": "APP-2025-007",
    "status": "APPROVED",
    "officerRemarks": "All documents verified..."
  }
}
```

**Notes:** Only `UNDER_REVIEW` applications may be decided. The assigned officer or ADMIN may act; rejection requires a non-empty reason. Backend records the remark in status history, creates an audit event, and inserts a status-update notification for the startup. Notification list/read APIs and screens are separate from this decision endpoint. No certificate number or statutory approval is issued. For `APPROVED`, the team must agree whether to add a portal recognition reference field or defer it; the current schema has no `metadata` field. Prakhar and Arnav coordinate any related API or schema amendment before implementation.

---

## 14. Notification Routes

### `GET /api/notifications`

**Auth:** Any authenticated user (returns own notifications only)

**Success `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Application Submitted",
      "message": "Your application APP-2025-007 has been submitted successfully.",
      "type": "status_update",
      "isRead": false,
      "applicationId": "APP-2025-007",
      "createdAt": "2025-11-11T12:00:00.000Z"
    }
  ]
}
```

---

### `PATCH /api/notifications/:id/read`

**Auth:** Any authenticated user; only that user's notification can be updated. Unknown IDs and IDs owned by another user return `404`.

**Success `200`:**
```json
{
  "success": true,
  "data": { "id": "uuid", "isRead": true }
}
```

---

### `PATCH /api/notifications/read-all`

Mark all notifications as read for the authenticated user.

**Auth:** Any authenticated user

**Success `200`:**
```json
{
  "success": true,
  "data": { "updatedCount": 5 }
}
```

---

## 15. Admin Routes

### `GET /api/admin/analytics`

**Auth:** `ADMIN` only

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "totalStartups": 75,
    "totalApplications": 120,
    "totalOfficers": 8,
    "byStatus": {
      "DRAFT": 10,
      "SUBMITTED": 20,
      "UNDER_REVIEW": 35,
      "QUERY_RAISED": 15,
      "RESUBMITTED": 10,
      "APPROVED": 25,
      "REJECTED": 5
    },
    "byCategory": [
      { "categoryName": "Ayurveda", "count": 60 },
      { "categoryName": "Yoga & Naturopathy", "count": 25 }
    ],
    "byState": [
      { "state": "Maharashtra", "count": 20 }
    ],
    "registrationTrend": [
      { "month": "Dec", "startups": 4, "applications": 6 }
    ],
    "recentApplications": [ ]
  }
}
```

---

### `GET /api/admin/users`

**Auth:** `ADMIN` only

**Query params:** `role`, `page`, `limit`, `search`

`role` accepts `STARTUP`, `OFFICER`, or `ADMIN`; omitted means all three. `search` matches the user's name, email, or associated startup's legal/brand name.

**Success `200`:** Paginated list of user objects (without `passwordHash` or account activation state). Each item includes `id`, `name`, `email`, `role`, `phone`, `createdAt`, and `startup` (either `{ "id", "legalName", "brandName" }` or `null`).

---

### `PATCH /api/admin/users/:id/toggle-active` — deferred

The current `User` schema has no account-active field. Do not implement this route or expose an `isActive` filter until the affected collaborators agree to a schema change and its migration. The frontend wrapper has been removed while this feature is deferred.

---

### `GET /api/admin/audit-logs`

**Auth:** `ADMIN` only

**Query params:** `actorId`, `entityType`, `action`, `actorRole`, `search`, `page`, `limit`. `actorRole` accepts `STARTUP`, `OFFICER`, `ADMIN`, or `SYSTEM`; `search` matches actor name, action, target type/id, and details.

**Success `200`:** Paginated audit log entries with `id`, `actorId`, `actorName`, `actorRole`, `action`, `targetEntity`, `targetId`, `details`, `ipAddress`, and `createdAt`.

---

## 16. Resource Routes

Resources are publicly accessible guides, portals, and regulatory links (read-only for non-admins). There is no `Resource` model/table in the existing SQL or Prisma schema. These endpoints read curated static content and must not attempt Prisma CRUD against a nonexistent table.

### `GET /api/resources`

**Auth:** None (public) or authenticated

**Query params:**
- `category` (optional): Filter by category name (e.g., `Government Portal`, `Startup Support`, `Research`, `Regulatory`, `Guide`, `Government Scheme`). Case-insensitive; passing `All` or omitting returns all categories.
- `search` (optional): Case-insensitive search query matching against resource `title`, `category`, `summary`, and `description`.
- `sortBy` (optional): Sort field (`title` or `category`).
- `order` (optional): Sort direction (`asc` or `desc`, default `asc`); only valid when `sortBy` is provided.
- `page` (optional): Positive integer, default `1`.
- `limit` (optional): Positive integer between `1` and `50`, default `10`.

Repeated query values and invalid sort fields or directions return `400` rather than being coerced or causing a server error.

**Success `200`:** Paginated list using the common pagination envelope from Section 5:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "res_001",
        "title": "Ministry of AYUSH — Official Portal",
        "category": "Government Portal",
        "summary": "Access official guidelines, policies, and notifications from the Ministry of AYUSH, Government of India.",
        "description": "Access official guidelines, policies, and notifications from the Ministry of AYUSH, Government of India.",
        "url": "https://ayush.gov.in",
        "type": "official",
        "isAvailable": true,
        "publishedAt": null
      },
      {
        "id": "res_007",
        "title": "AYUSH Startup Registration Guide",
        "category": "Guide",
        "summary": "A comprehensive step-by-step walkthrough covering registration wizard steps, document requirements, and verification workflows on the AYUSH portal.",
        "description": "A comprehensive step-by-step walkthrough covering registration wizard steps, document requirements, and verification workflows on the AYUSH portal.",
        "url": "/how-it-works",
        "type": "internal",
        "isAvailable": true,
        "publishedAt": null
      },
      {
        "id": "res_011",
        "title": "Clinical Trial Registry — India (CTRI) AYUSH Guidelines",
        "category": "Research",
        "summary": "Protocols and regulatory requirements for clinical trials in traditional Indian medicine. Detailed documentation is currently under review.",
        "description": "Protocols and regulatory requirements for clinical trials in traditional Indian medicine. Detailed documentation is currently under review.",
        "url": null,
        "type": "official",
        "isAvailable": false,
        "publishedAt": null
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 11, "totalPages": 2 }
  }
}
```

**Resource Object Fields:**
- `id` (string): Stable identifier (e.g., `res_001`).
- `title` (string): Display title of the resource or portal.
- `category` (string): Categorization (`Government Portal`, `Startup Support`, `Research`, `Regulatory`, `Guide`, `Government Scheme`).
- `summary` (string): Concise summary of the resource content.
- `description` (string): Matches summary for full backward compatibility across frontend components.
- `url` (string | null): Verified destination URL. External URLs use absolute HTTPS schemes (`https://...`); internal portal guides use relative paths (e.g., `/how-it-works`). Resources pending publication or documentation review have `url: null`.
- `type` (string): Classification for frontend badges and icons (`official`, `guide`, `internal`).
- `isAvailable` (boolean): `true` if active and accessible; `false` if documentation is under review or temporarily unavailable.
- `publishedAt` (string | null): ISO timestamp or `null` for static curated resources.

### `GET /api/resources/:id`

**Auth:** None (public) or authenticated

**Success `200`:** `{ "success": true, "data": <resource object> }`. Returns the single resource matching the provided ID.

**Error `404`:** `{ "success": false, "error": "Resource not found." }` when no resource matches the provided ID.

---

### `GET /api/categories`

Returns the list of AYUSH categories (Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homoeopathy). The `code` is the category identifier; there is no separate UUID `id`.

**Auth:** None (public)

Only active AYUSH categories are returned, sorted by name. This endpoint does not return business activities or document requirements; those remain static reference lists in the current admin screen.

**Success `200`:**
```json
{
  "success": true,
  "data": [
    { "code": "AYURVEDA", "name": "Ayurveda", "description": "..." }
  ]
}
```

---

## 17. Error Codes

| HTTP Status | Meaning | When to use |
| :--- | :--- | :--- |
| `200` | OK | Successful GET / PATCH / PUT / DELETE |
| `201` | Created | Successful POST that creates a resource |
| `400` | Bad Request | Malformed request body or invalid parameters |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Valid token but insufficient role / ownership |
| `404` | Not Found | Requested resource does not exist |
| `409` | Conflict | Duplicate unique constraint (e.g., email already registered) |
| `413` | Payload Too Large | File upload exceeds allowed size |
| `415` | Unsupported Media Type | Uploaded file type not permitted |
| `422` | Unprocessable Entity | Validation errors on specific fields |
| `500` | Internal Server Error | Unhandled server error |

---

## 18. Frontend Status Label Mapping

The frontend must map canonical backend values to display labels. The current implementation is `frontend/src/utils/statusHelpers.js`; it also handles existing mock display labels and unknown values safely:

```js
export const STATUS_LABELS = {
  DRAFT:        'Draft',
  SUBMITTED:    'Submitted',
  UNDER_REVIEW: 'Under Review',
  QUERY_RAISED: 'Clarification Required',
  RESUBMITTED:  'Resubmitted',
  APPROVED:     'Approved',
  REJECTED:     'Rejected',
};

export const STATUS_COLORS = {
  DRAFT:        'gray',
  SUBMITTED:    'blue',
  UNDER_REVIEW: 'yellow',
  QUERY_RAISED: 'orange',
  RESUBMITTED:  'purple',
  APPROVED:     'green',
  REJECTED:     'red',
};
```

> For API data, never hardcode display labels such as `'Under Review'` or `'Draft'` in application logic; derive them from the canonical enum. Some mock-backed screens and contexts still use display-label values and must be normalized during live integration.

---

## 19. File Upload Specification

| Property | Value |
| :--- | :--- |
| Max file size | 5 MB by default; configured per document type by `DocumentType.maxSizeMb` |
| Allowed file formats | `.pdf`, `.jpg`, `.jpeg`, `.png` by default; configured by the comma-separated `DocumentType.allowedFormats` field |
| Upload field name | `file` |
| Upload endpoint | `POST /api/applications/:id/documents` |
| Storage | Local filesystem (Phase 2); cloud storage (future phase) |
| Database value | Store a private relative storage reference in `Document.fileUrl`; do not return it as a public URL |

> **Phase 2 storage:** Store uploaded files in `backend/uploads/<applicationId>/` on the server filesystem. Do not expose the raw storage reference to the frontend — provide a separate secure download endpoint if needed.

---

## 20. Important Notes & Constraints

### Portal Recognition vs. Statutory Approvals

> **CRITICAL:** This portal facilitates the **registration and review** of AYUSH startup applications for the Ministry of AYUSH / AIIA. It does **NOT** issue statutory AYUSH licenses, regulatory approvals, or any government certification that carries legal force under the Drugs and Cosmetics Act, AYUSH regulations, or any other statute.
>
> Any portal-issued recognition number, acknowledgement, or status update is an **internal administrative record only**. All backend responses, frontend labels, and notification text must reflect this clearly (e.g., use "Portal Registration Acknowledgement" or "Application Approved by Reviewer", never "AYUSH License Granted" or "Regulatory Approval Issued").

### Backend constraints

- CommonJS (`require` / `module.exports`) throughout backend — no ESM imports.
- No TypeScript. All backend files are `.js`.
- Prisma 7 with `@prisma/adapter-pg`. Use `prisma7.config.js` for config.
- Do not use `prisma.$connect()` manually — `@prisma/adapter-pg` handles pooling.
- Implemented routes use shared HTTP helpers and route-level validation (`backend/src/utils/http.js`). New route modules should return the same structured client-error shape; any additional validation library should be agreed by the route owners rather than assumed to be present in the backend.
- Passwords: bcrypt with ≥ 10 rounds. Never return `passwordHash` in any response.
- JWT: sign with `JWT_SECRET` from env, include `{ id, email, role }` in payload.
- All DB timestamps: PostgreSQL `TIMESTAMPTZ`, Prisma `DateTime`.

### Frontend implementation status

- The API client wrappers follow the endpoint shapes in this document. The public and startup resources pages consume `resourceAPI`; `AuthContext` consumes auth and startup profile endpoints; applicant screens consume startup/application and clarification endpoints for live startup accounts. Officer/admin queues, assignment, review, clarification, notification, category, analytics, user-list, and audit-log screens are connected to the API. Demo flows and demo notifications remain local.
- The client-side `generateAppId()` helper was removed. The local demo uses an internal `mock-…` record ID and leaves `trackingNumber` empty; only the backend may generate the database application ID in the required formatted string.
- Native `alert()` feedback was removed from `NewApplication.jsx` and replaced with inline feedback. Other prototype pages may still contain placeholder alerts.
- Auth, startup profile, core application, officer queue, assignment, review-start, decision, clarification-query, notification-list/read, category-list, and read-only admin analytics/user/audit-log endpoints are implemented. Real applicant flows and officer/admin review and admin oversight screens consume their APIs for live sessions. Applicants can read and respond to clarification queries and resubmit; officers/admins can raise and resolve them. Startup, officer, and admin screens load notifications and mark them read. The seven-step form maps AYUSH labels to seeded category codes and stores regulatory/business answers in the documented JSON fields. Demo mode remains local. Document upload/verification and account activation remain unimplemented.
- Application detail reads server status history, founders, documents, and clarification queries. The live applicant flow can respond to queries but does not upload documents. The officer review page displays document metadata but does not open or verify files. Founder records belong to the startup profile and cannot hold application-specific founder snapshots in this schema.
- See [implementation-status.md](./implementation-status.md) for backend readiness and SQL/Prisma alignment gaps.

### Database compatibility rule

The proposed mappings in this draft follow the existing database design. Keep database column names, key types, CHECK values, and relationships as defined by `database/schema.sql` and `backend/prisma/schema.prisma`. If a requested API feature cannot be represented by those fields, agree on a response/request transformation or defer the feature. Do not change the schema to match an older example in this document.

### Schema change protocol

If a collaborator identifies a required schema change after this contract is agreed:

1. Raise the change in a team discussion.
2. Agree on the database design change before implementation.
3. Update `database/schema.sql`, `backend/prisma/schema.prisma`, and the Prisma migration history together.
4. Update this API contract and related documentation with the same change.
5. No unilateral schema changes.

---

*Draft reconciliation prepared 14 November 2026. The existing SQL and Prisma schema remain unchanged. Prakhar's route sections were checked against the backend and the full backend workflow was smoke-verified against PostgreSQL; review the contract with the affected collaborators, including Arnav's cross-owner sections, before treating version 1.5 as agreed.*


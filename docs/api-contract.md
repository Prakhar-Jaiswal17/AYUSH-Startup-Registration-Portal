# API Contract — AYUSH Startup Registration Portal

> **Document version:** 1.1
> **Phase:** Phase 2 — Chunk 4 (API contract aligned to the existing PostgreSQL schema)
> **Status:** Database mapping updated 11 November 2026; API aliases must follow the mappings below. This does not change the SQL or Prisma schema.

This contract is the single source of truth for all HTTP API communication between the React frontend and the Express backend. Both Prakhar (backend) and the teammate (frontend integration + officer/review routes) must follow this document exactly.

---

## Table of Contents

1. [Base URL & Environment](#1-base-url--environment)
2. [Authentication](#2-authentication)
3. [Shared Enums](#3-shared-enums)
4. [Response Shape](#4-response-shape)
5. [Pagination Shape](#5-pagination-shape)
6. [Database Model Names & Key Fields](#6-database-model-names--key-fields)
7. [Route Ownership](#7-route-ownership)
8. [Auth Routes](#8-auth-routes-prakhar)
9. [Startup Profile Routes](#9-startup-profile-routes-prakhar)
10. [Application Routes — Startup-Facing](#10-application-routes--startup-facing-prakhar)
11. [Document Routes](#11-document-routes-teammate)
12. [Clarification Query Routes](#12-clarification-query-routes-teammate)
13. [Officer Routes](#13-officer-routes-teammate)
14. [Notification Routes](#14-notification-routes-teammate)
15. [Admin Routes](#15-admin-routes-teammate)
16. [Resource Routes](#16-resource-routes-teammate)
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

> **Current frontend status (11 November 2026):** `frontend/src/services/api.js` now uses `VITE_API_URL` with the documented `http://localhost:3005/api` fallback, and `frontend/.env.example` contains the same value. No local `.env` file is required or committed.

Backend env variables required in `backend/.env`:

```
DATABASE_URL=...          # PostgreSQL connection string (Prakhar owns this)
JWT_SECRET=...            # Random 256-bit secret
JWT_EXPIRES_IN=7d         # Token lifetime
PORT=3005
CLIENT_URL=http://localhost:5173
```

---

## 2. Authentication

**Method:** JWT Bearer Token

- After login, the backend returns a `token` string.
- The API client reads it from `localStorage` under `ayush_setu_token` and attaches it to requests. The current `AuthContext` remains mock-backed and does not yet store a backend token.
- Every protected request must include the header:

```
Authorization: Bearer <token>
```

- The backend middleware (`middleware/auth.js`, owned by Prakhar) verifies the token and attaches `req.user` to the request object.

### `req.user` shape (set by auth middleware)

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "STARTUP",
  "name": "Full Name"
}
```

---

## 3. Shared Enums

The HTTP API may use the stable uppercase values below. Before querying or writing PostgreSQL, the backend must translate them to the stored values in the mapping tables below. Prisma fields are strings; the database CHECK constraints accept only the stored values. Do not pass API enum values directly into Prisma.

### Role Enum

Used in API responses and `req.user.role`. Store the lowercase representation in `users.role` and `audit_logs.actor_role`.
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

Every response from the API — success or error — uses one of these two shapes. No exceptions.

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
| `Startup` | UUID `id`; unique `userId`; `legalName`, `brandName`, incorporation details, registration number, official email, website, `ayushDomain` FK to category code, arrays `businessActivities`/`existingLicences`, description/products/stage/market, operational status, state/city, DPIIT fields, timestamps. | One profile belongs to one user. API must use these fields or explicitly map `startupName` to both name fields under a documented product rule. |
| `Founder` | UUID `id`; `startupId` FK; required name, designation, email, phone, qualification; `isPrimary`; `createdAt`. | Founders belong to the startup profile, not an application. No applicationId, DIN, or shareholding is stored. |
| `Application` | String `id` primary key in `APP-YYYY-NNN` format; `startupId`; `ayushDomain` FK to category code; stored status; required state; optional assigned officer; JSONB `regulatoryDetails` and `businessDetailsSnapshot`; legacy nullable certificate fields; submitted/created/lastUpdated timestamps. | `id` itself is the tracking number. Do not expose a UUID application id or create a second stored tracking-number field; an identical API alias is optional. Review/decision timestamps and officer remarks are not application columns; use status history for remarks/timing. |
| `Document` | UUID `id`; optional application FK; required startup FK; optional `documentTypeCode`; `name`, `fileName`, `fileUrl`, string `fileSize`, `mimeType`, stored status, remark, optional verifier/timestamp, `uploadedAt`. | No uploadedBy column. Store the byte count as a decimal string in `fileSize`; API `fileSizeBytes` is parsed from it. `fileUrl` must be a private storage reference and must not be returned as a public URL. |
| `ApplicationStatusHistory` | UUID `id`; application FK; nullable `previousStatus`; required `status`, `remark`; optional `officerName` and `actorId`; `createdAt`. | Use `status` (not `newStatus`) in persistence. Actor FK is nullable; `remark` is required. |
| `ClarificationQuery` | UUID `id`; application FK; required `officerId`, `queryText`; nullable `responseText`; stored `status` (`Pending`/`Resolved`); `createdAt`, nullable `resolvedAt`. | Map `applicantResponse` to `responseText`. There is no `responseSubmittedAt`; resolution time is distinct. |
| `Notification` | UUID `id`; `userId`; title/message/type; nullable `applicationId` (the formatted string key); `isRead`; `createdAt`. | Application references use the tracking-number string. |
| `AuditLog` | UUID `id`; nullable actor FK; required `actorName`, constrained `actorRole`, action, `targetEntity`, string `targetId`, text `details`, optional IP, `createdAt`. | Map `entityType`/`entityId`/`metadata` only if serialized into these existing fields. Do not assume a JSON metadata column. |

The following earlier contract fields have no persistence column and must not be treated as stored: `User.isActive`; application `reviewStartedAt`, `decidedAt`, and `officerRemarks`; founder `applicationId`, `dinNumber`, and `shareholding`; document `uploadedById`; query `responseSubmittedAt`; and all `Resource` records. The resource endpoints must serve static/configured content unless a future database change is agreed. `certificateNumber` is legacy data only and must never be represented as an AYUSH license, statutory approval, or government certification issued by this portal.

> **Tracking number generation:** The backend generates the `Application.id` in the database's required `APP-YYYY-NNN` format. The response may expose this same value as `id` and/or a convenience `trackingNumber` alias, but there is only one stored identifier. Use that string as the application ID in every route and foreign key.

---

## 7. Route Ownership

| Route prefix | File | Owner |
| :--- | :--- | :--- |
| `/api/auth/*` | `backend/src/routes/auth.js` | **Prakhar** |
| `/api/startups/*` | `backend/src/routes/startups.js` | **Prakhar** |
| `/api/applications/*` (startup-facing CRUD + submit) | `backend/src/routes/applications.js` | **Prakhar** |
| Shared auth middleware | `backend/src/middleware/auth.js` | **Prakhar** |
| Shared validation middleware | `backend/src/middleware/validateRequest.js` | **Prakhar** |
| `/api/applications/:id/documents` (upload) | `backend/src/routes/documents.js` | **Teammate** |
| `/api/documents/*` (verify, delete) | `backend/src/routes/documents.js` | **Teammate** |
| `/api/applications/:id/queries` | `backend/src/routes/queries.js` | **Teammate** |
| `/api/queries/*` (respond, resolve) | `backend/src/routes/queries.js` | **Teammate** |
| `/api/officer/*` | `backend/src/routes/officer.js` | **Teammate** |
| `/api/notifications/*` | `backend/src/routes/notifications.js` | **Teammate** |
| `/api/admin/*` | `backend/src/routes/admin.js` | **Teammate** |
| `/api/resources/*` | `backend/src/routes/resources.js` | **Teammate** |
| `/api/categories` | `backend/src/routes/categories.js` | **Teammate** |

### Mounting order in `server.js` (Prakhar adds his, teammate adds theirs)

```js
// Prakhar mounts
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/startups',     require('./routes/startups'));
app.use('/api/applications', require('./routes/applications'));

// Arnav mounts
app.use('/api/documents',      require('./routes/documents'));
app.use('/api/queries',        require('./routes/queries'));
app.use('/api/officer',        require('./routes/officer'));
app.use('/api/notifications',  require('./routes/notifications'));
app.use('/api/admin',          require('./routes/admin'));
app.use('/api/resources',      require('./routes/resources'));
app.use('/api/categories',     require('./routes/categories'));
```

> Arnav must NOT edit `server.js` body — only add the `app.use(...)` lines above in coordination with Prakhar. Agree on a single commit to avoid merge conflicts on `server.js`.

---

## 8. Auth Routes (Prakhar)

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
      "phone": "9876543210"
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
      "phone": "9876543210"
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

## 9. Startup Profile Routes (Prakhar)

### `GET /api/startups/:id`

**Auth:** Required — `STARTUP` (own profile only) or `OFFICER` / `ADMIN`

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "startupName": "AyurTech Innovations Pvt. Ltd.",
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

**Request body:** Any subset of startup fields (`startupName`, `registrationNumber`, `incorporationDate`, `website`, `description`).

**Success `200`:** Updated startup object (same shape as GET above).

---

## 10. Application Routes — Startup-Facing (Prakhar)

### `POST /api/applications`

Create a new draft application.

**Auth:** `STARTUP`

**Request body:**
```json
{
  "categoryId": "uuid",
  "startupDetails": {
    "startupName": "AyurTech Innovations Pvt. Ltd.",
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
      "dinNumber": "12345678",
      "shareholding": 60.00
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

**Success `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "trackingNumber": "APP-2025-007",
    "status": "DRAFT",
    "categoryId": "uuid",
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
  "id": "uuid",
  "trackingNumber": "APP-2025-007",
  "status": "DRAFT",
  "startupName": "AyurTech Innovations Pvt. Ltd.",
  "categoryName": "Ayurveda",
  "submittedAt": null,
  "updatedAt": "2025-11-11T10:00:00.000Z"
}
```

---

### `GET /api/applications/:id`

Get full application details.

**Auth:** `STARTUP` (own), `OFFICER` (assigned or any if ADMIN)

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "trackingNumber": "APP-2025-007",
    "status": "UNDER_REVIEW",
    "category": { "id": "uuid", "name": "Ayurveda", "code": "AYU" },
    "startup": { "id": "uuid", "startupName": "AyurTech Innovations Pvt. Ltd." },
    "assignedOfficer": { "id": "uuid", "name": "Dr. Priya Nair" },
    "founders": [ { "name": "Riya Sharma", "designation": "CEO", "email": "riya@ayurtech.in" } ],
    "regulatoryInfo": { "dpiitRecognized": false, "gstNumber": "27AAAAA0000A1Z5" },
    "businessInfo": { "employeeCount": 12, "fundingStage": "Seed" },
    "documents": [ { "id": "uuid", "fileName": "pan_card.pdf", "verificationStatus": "VERIFIED" } ],
    "statusHistory": [
      {
        "previousStatus": null,
        "newStatus": "DRAFT",
        "remark": "Draft created",
        "changedBy": { "id": "uuid", "name": "Riya Sharma" },
        "createdAt": "2025-11-01T10:00:00.000Z"
      }
    ],
    "queries": [ ],
    "submittedAt": "2025-11-05T09:00:00.000Z",
    "updatedAt": "2025-11-10T14:00:00.000Z"
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
    "id": "uuid",
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
      "newStatus": "DRAFT",
      "changedBy": { "id": "uuid", "name": "Riya Sharma" },
      "remarks": null,
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

---

## 11. Document Routes (Teammate)

### `POST /api/applications/:id/documents`

Upload a document for an application.

**Auth:** `STARTUP` (own application, status must be `DRAFT` or `QUERY_RAISED`)

**Content-Type:** `multipart/form-data`

**Form fields:**
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | File | Yes | The document file |
| `documentTypeId` | String (UUID) | Yes | FK → `DocumentType.id` |

**Success `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileName": "pan_card.pdf",
    "mimeType": "application/pdf",
    "fileSizeBytes": 102400,
    "documentTypeId": "uuid",
    "documentTypeName": "PAN Card",
    "verificationStatus": "PENDING",
    "uploadedAt": "2025-11-11T12:00:00.000Z"
  }
}
```

**Errors:** `413` if file exceeds `maxFileSizeBytes` for the document type. `415` if MIME type is not in `allowedMimeTypes`.

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
  "verificationStatus": "VERIFIED",
  "verificationRemarks": "Document is clear and valid."
}
```

`remark` maps to `documents.remark`.

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

## 12. Clarification Query Routes (Teammate)

### `POST /api/applications/:id/queries`

Officer raises a clarification query. Status transitions to `QUERY_RAISED`.

**Auth:** `OFFICER`, `ADMIN`

**Request body:**
```json
{
  "queryText": "Please provide audited financial statements for FY 2023-24."
}
```

**Success `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "applicationId": "uuid",
    "queryText": "Please provide audited financial statements for FY 2023-24.",
    "isResolved": false,
    "createdAt": "2025-11-11T14:00:00.000Z"
  }
}
```

**Notes:** Also updates `applications.status → QUERY_RAISED`, records status history, sends notification to startup.

---

### `GET /api/applications/:id/queries`

List all clarification queries for an application.

**Auth:** `STARTUP` (own), `OFFICER`, `ADMIN`

**Success `200`:** Array of query objects including `applicantResponse` and `responseSubmittedAt`.

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

**Success `200`:** Updated query object with `applicantResponse` and `responseSubmittedAt` set.

---

### `PATCH /api/queries/:id/resolve`

Officer marks a query as resolved.

**Auth:** `OFFICER`, `ADMIN`

**Request body:** None

**Success `200`:** Updated query with `isResolved: true`.

---

## 13. Officer Routes (Teammate)

### `GET /api/officer/applications`

Get all applications assigned to the authenticated officer, or all submitted applications for ADMIN.

**Auth:** `OFFICER`, `ADMIN`

**Query params:** `status`, `categoryId`, `page`, `limit`, `search` (startup name or tracking number)

**Success `200`:** Paginated list of applications (same item shape as [Section 10 GET /api/applications](#get-apiapplications)).

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

**Success `200`:** Updated application with `assignedOfficer` populated.

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
    "id": "uuid",
    "status": "UNDER_REVIEW",
    "reviewStartedAt": "2025-11-11T14:00:00.000Z"
  }
}
```

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
    "id": "uuid",
    "trackingNumber": "APP-2025-007",
    "status": "APPROVED",
    "officerRemarks": "All documents verified..."
  }
}
```

**Notes:** Backend records status history and creates notification to startup. For `APPROVED`, backend may generate a portal recognition reference number (stored in `metadata` or a dedicated field — Prakhar to decide and document the field name in an amendment to this contract before implementation).

---

## 14. Notification Routes (Teammate)

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
      "type": "STATUS_CHANGE",
      "isRead": false,
      "applicationId": "uuid",
      "createdAt": "2025-11-11T12:00:00.000Z"
    }
  ]
}
```

---

### `PATCH /api/notifications/:id/read`

**Auth:** Owner of the notification

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

## 15. Admin Routes (Teammate)

### `GET /api/admin/analytics`

**Auth:** `ADMIN` only

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "totalApplications": 120,
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
    "recentApplications": [ ]
  }
}
```

---

### `GET /api/admin/users`

**Auth:** `ADMIN` only

**Query params:** `role`, `isActive`, `page`, `limit`, `search`

**Success `200`:** Paginated list of user objects (without `passwordHash`).

---

### `PATCH /api/admin/users/:id/toggle-active`

Activate or deactivate a user account.

**Auth:** `ADMIN` only

**Success `200`:**
```json
{
  "success": true,
  "data": { "id": "uuid", "isActive": false }
}
```

---

### `GET /api/admin/audit-logs`

**Auth:** `ADMIN` only

**Query params:** `actorId`, `entityType`, `action`, `page`, `limit`

**Success `200`:** Paginated list of audit log entries.

---

## 16. Resource Routes (Teammate)

Resources are publicly accessible guides and FAQs (read-only for non-admins). There is no `Resource` model/table in the existing SQL or Prisma schema. These endpoints must read static/configured content and must not attempt Prisma CRUD against a nonexistent table.

### `GET /api/resources`

**Auth:** None (public) or authenticated

**Query params:** `category`, `search`, `page`, `limit`

**Success `200`:** Paginated list:
```json
{
  "id": "uuid",
  "title": "How to register an AYUSH startup",
  "category": "Guide",
  "summary": "Step-by-step registration walkthrough.",
  "url": "https://ayush.gov.in/resource/1",
  "publishedAt": "2025-01-01T00:00:00.000Z"
}
```

### `GET /api/resources/:id`

**Auth:** None

**Success `200`:** Full resource object.

---

### `GET /api/categories`

Returns the list of AYUSH categories (Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homoeopathy).

**Auth:** None (public)

**Success `200`:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Ayurveda", "code": "AYU", "description": "..." }
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
| Max file size | 5 MB per file (configurable per `DocumentType.maxFileSizeBytes`) |
| Allowed MIME types | `application/pdf`, `image/jpeg`, `image/png` (configurable per `DocumentType.allowedMimeTypes`) |
| Upload field name | `file` |
| Upload endpoint | `POST /api/applications/:id/documents` |
| Storage | Local filesystem (Phase 2); cloud storage (future phase) |
| Path returned | Relative server path in `storagePath`; not a public URL in Phase 2 |

> **Phase 2 storage:** Store uploaded files in `backend/uploads/<applicationId>/` on the server filesystem. Do not expose the raw `storagePath` to the frontend — provide a separate secure download endpoint if needed.

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
- Use `express-validator` or Zod (team preference) for request validation.
- Passwords: bcrypt with ≥ 10 rounds. Never return `passwordHash` in any response.
- JWT: sign with `JWT_SECRET` from env, include `{ id, email, role }` in payload.
- All DB timestamps: PostgreSQL `TIMESTAMPTZ`, Prisma `DateTime`.

### Frontend implementation status

- The API client wrappers are prepared against the endpoint shapes in this document, but no screen or context currently calls them.
- The client-side `generateAppId()` helper was removed. The local demo uses an internal `mock-…` record ID and leaves `trackingNumber` empty; only the backend may generate the database application ID in the required formatted string.
- Native `alert()` feedback was removed from `NewApplication.jsx` and replaced with inline feedback. Other prototype pages may still contain placeholder alerts.
- `AuthContext`, `ApplicationContext`, and `NotificationContext` remain mock-backed until the backend endpoints are implemented.
- The seven-step form keeps its complete data in the local demo record. Map its category selection to the database category `code`; application-specific regulatory and business answers belong in JSONB `regulatoryDetails` and `businessDetailsSnapshot`. Founder records belong to the startup profile and cannot hold application-specific founder snapshots in this schema.
- See [implementation-status.md](./implementation-status.md) for backend readiness and SQL/Prisma alignment gaps.

### Database compatibility rule

This contract is now mapped to the existing database design. Keep database column names, key types, CHECK values, and relationships as defined by `database/schema.sql` and `backend/prisma/schema.prisma`. If a requested API feature cannot be represented by those fields, use an explicitly documented response/request transformation or defer the feature. Do not change the schema to match an older example in this document.

### Schema change protocol

If either developer identifies a required schema change after this contract is agreed:

1. Raise the change in a team discussion.
2. Agree on the database design change before implementation.
3. Update `database/schema.sql`, `backend/prisma/schema.prisma`, and the Prisma migration history together.
4. Update this API contract and related documentation with the same change.
5. No unilateral schema changes.

---

*Database-compatible contract mapping updated 11 November 2026. The existing SQL and Prisma schema remain unchanged; backend serializers translate API wire fields to database columns.*


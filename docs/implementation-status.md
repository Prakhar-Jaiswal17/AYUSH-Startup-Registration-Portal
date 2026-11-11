# Implementation Status

**Verified:** 11 November 2026  
**Scope:** Repository state in the `main` working tree. The design and API documents below describe the target system unless this page says they are implemented.

## Current state

| Area | Implemented now | Not implemented or not verified |
|---|---|---|
| Frontend | React 19/Vite portal screens for public, startup, officer, and admin roles; client-side routes; demo login; seven-step application prototype; status badge and timeline mapping. | Pages are not connected to backend APIs. Client-side route guards are for demo navigation and do not enforce security. |
| API client | Axios base URL from `VITE_API_URL` with `http://localhost:3005/api` fallback; Bearer-token request interceptor; centralized error-message helper; wrappers prepared against `api-contract.md`. | The wrappers have no screen/context consumers yet. `AuthContext` does not store a backend token. |
| Frontend state | `AuthContext`, `ApplicationContext`, and `NotificationContext` still use mock data and browser storage. The new-application demo keeps the full form snapshot locally and uses an internal `mock-…` record ID. | No server-generated tracking number is available in the demo. The UI explicitly does not display a fabricated one. |
| Backend | CommonJS Express scaffold listens on port 3005, enables CORS/JSON parsing, and exposes `GET /api/health`. | Authentication middleware and business route files are absent. No live API workflow is implemented. |
| Prisma | Prisma 7 package/configuration and PostgreSQL datasource declaration exist. | `backend/prisma/schema.prisma` has no models; no migration set or generated application client was found. |
| SQL database | `database/schema.sql`, `seed.sql`, and `queries.sql` define a standalone 11-table PostgreSQL implementation and examples. `database/README.md` reports testing on PostgreSQL 18.6. | This review did not rerun the SQL scripts or verify a connection from the backend. |
| File handling | UI placeholders and a reusable client-side file-selection component exist. | The new-application wizard and document centre do not persist uploaded files to the API or private server storage. |

## Phase A1 frontend preparation

- The API client now follows the documented route paths where wrappers exist, including officer queues, queries, notifications, admin users, resources, and categories.
- `statusHelpers.js` maps the canonical API statuses to display labels and colors, with safe handling for unknown values. The status badge and timeline use this mapping while remaining compatible with existing mock display labels.
- The new-application mock flow retains all seven-step fields locally, shows save/submission feedback, prevents duplicate clicks, and does not generate a tracking number.
- The frontend `.env.example` already contains `VITE_API_URL=http://localhost:3005/api`; environment files are ignored by Git.
- Auth, application, and notification contexts remain mock-backed until the backend routes and response behavior are available.

## Integration gaps to resolve

`api-contract.md` is the agreed target contract; its endpoint and model definitions have not been changed here. Before live integration, the team must reconcile these existing differences:

1. The contract models `Application.id` as a UUID and stores a separate `trackingNumber`; `database/schema.sql` uses the formatted tracking number as the `applications.id` primary key.
2. The contract uses uppercase role/status enums and UUID IDs for categories and document types. The SQL schema uses lowercase roles, title-case statuses, and category/document-type codes as keys.
3. The form's AYUSH selection currently uses mock slugs, while the API contract requires a category UUID.
4. The contract's application request example does not define fields for much of the seven-step form. Do not silently drop those fields or extend the agreed request shape without team agreement.
5. The form's upload-step copy says `10MB` and includes `DOC`; the API contract specifies a 5 MB limit and PDF/JPEG/PNG MIME types. The wizard currently adds placeholder metadata rather than uploading a file.
6. The contract names `CLIENT_URL`; `backend/.env.example` and `server.js` use `FRONTEND_ORIGIN`.
7. The SQL schema retains legacy `certificate_number` fields from an earlier draft. Any retained value may identify only an internal portal record, never a statutory license, regulatory approval, or certification with legal force.
8. Mock contexts use lowercase role values and title-case application statuses, while the API contract requires uppercase roles and canonical snake-case status values. The status utility handles display mapping; API integration still needs consistent conversion.

## Verification

- `npm run build` passed. Vite reported dependency comment warnings and a bundle-size warning.
- `npm run lint` could not start because ESLint 9 requires an `eslint.config.*` file, which is absent from the repository.
- Browser check confirmed demo startup login, local draft feedback, mock document metadata, and navigation through the wizard to its review step. No backend submission was made.
- Runtime database connectivity and backend API behavior remain unverified.

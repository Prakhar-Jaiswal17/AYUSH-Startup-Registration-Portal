# Implementation Status

**Reviewed:** 14 November 2026
**Scope:** Repository state in the `main` working tree. The design and API documents below describe the target system unless this page says they are implemented.

**Team responsibilities:** See [team-roles.md](./team-roles.md) and the route ownership table in [api-contract.md](./api-contract.md).

## Current state

| Area | Implemented now | Not implemented or not verified |
|---|---|---|
| Frontend | React 19/Vite portal screens for public, startup, officer, and admin roles; client-side routes; demo login; seven-step application flow; status badge and timeline mapping. Real login, registration, logout, and session restoration use the backend auth API; demo role sign-in remains local. Public and startup resources screens consume `/api/resources`. Live startup accounts load their profile and application list/detail from the API; draft create/update and submission use the backend and server tracking IDs. Demo accounts retain the local mock workflow. | Document upload, clarification responses, notifications, and officer/admin workflows are not connected to their APIs. Client-side route guards are for UI navigation and do not enforce security. |
| Desktop app | Electron launcher in `desk_App/` starts the existing Vite frontend and loads it in a native desktop window. It reuses the same React routes, demo accounts, mock data, and browser-storage behavior; context isolation is enabled and Node integration is disabled. | Requires Node/npm, Electron installed in `desk_App/`, and frontend dependencies installed. This is a development launcher, not a packaged installer. It does not add a separate desktop-only workflow or live backend integration. |
| API client | Axios base URL from `VITE_API_URL` with `http://localhost:3005/api` fallback; Bearer-token request interceptor; centralized error-message helper; wrappers follow `api-contract.md`. Auth, startup profile, application, and resource wrappers are consumed by connected screens/contexts. | Officer, query, document, admin, notification, and category wrappers remain unconnected to their workflows. |
| Frontend state | `AuthContext` uses backend auth for real accounts, restores `/auth/profile`, and loads `/startups/me`. `ApplicationContext` fetches a live startup's application list and uses create/update/submit endpoints. The new-application screen supports API draft editing and server tracking IDs; incomplete drafts remain in browser storage until required API fields exist. Demo role sign-in and demo applications remain local. | `NotificationContext` remains mock-backed; no API document upload or clarification response is available in the connected applicant flow yet. |
| Backend | CommonJS Express API exposes health, bcrypt/JWT auth, startup profile read/create/update, application draft create/list/detail/update/submit/status history, and public static resources routes. Startup/application APIs use Prisma transactions, role/ownership checks, status conversion, audit events, and notifications on submit. Resources behavior is covered by an automated route suite. | Document/query/officer/admin/category APIs are not implemented as mounted business routes. |
| Prisma | Prisma 7 models map all 11 tables; migrations create tables, indexes, foreign keys, and CHECK constraints; Prisma Client is generated. Shared Prisma 7 PostgreSQL adapter is used by API routes. Idempotent seed command inserts missing AYUSH categories without deleting records. | Remaining team route modules and UI flows are not yet integrated with Prisma. |
| SQL database | `database/schema.sql`, `seed.sql`, and `queries.sql` remain available as the standalone SQL/DBMS scripts. The Prisma migration history is the reproducible setup path for the backend. | Seed/query scripts are not part of the Prisma migrations. Use one schema-creation path on a fresh database; do not run the destructive SQL schema script over a database initialized by migrations. |
| File handling | The demo upload instructions and reusable file-selection component use the schema defaults: 5 MB and PDF/JPG/JPEG/PNG. Live applicant screens identify document upload as unavailable and do not claim mock selections were sent. | Document upload and verification APIs, private file storage, and persistent file metadata are not connected. |

## Phase A1 frontend preparation

- The API client now follows the documented route paths where wrappers exist, including officer queues, queries, notifications, admin users, resources, and categories.
- `statusHelpers.js` maps the canonical API statuses to display labels and colors, with safe handling for unknown values. The status badge and timeline use this mapping while remaining compatible with existing mock display labels.
- The new-application mock flow retains all seven-step fields locally, shows save/submission feedback, prevents duplicate clicks, and does not generate a tracking number.
- The frontend `.env.example` already contains `VITE_API_URL=http://localhost:3005/api`; environment files are ignored by Git.
- Real applicant login, registration, logout, and session restoration use the backend; demo role login remains local. Startup profile display and the applicant application list, detail, draft, and submission flows now use the startup/application APIs for real API sessions. Demo application flows remain local. Notification screens, document uploads, clarification responses, and officer/admin workflows remain unconnected.
- The API application flow maps AYUSH labels to seeded category codes, stores regulatory/business fields in their JSON payloads, displays server tracking IDs and status history, and marks document/query actions unavailable where their APIs are not connected.
- `desk_App/main.js` launches the frontend Vite server at `127.0.0.1:5173` when it is not already running, then opens that site in Electron. Closing Electron stops the Vite process it started.
- The desktop experience inherits the current website's registration and demo role sign-in flows; it is not a separate authentication implementation.

## Integration gaps to resolve

API contract version 1.4 is a draft pending review by the route owners. The resources route and public/startup page integration have been reconciled, runtime-verified, and connected. Before full integration, account for the remaining mappings and gaps:

1. Map category selection to `ayush_categories.code`, not a UUID.
2. Translate uppercase API roles/statuses to lowercase/title-case database values.
3. The application ID is the formatted tracking number; an optional `trackingNumber` alias may return the same value.
4. Application regulatory/business data uses flexible JSONB fields; founders belong to the startup profile.
5. The upload UI now reflects the 5 MB and `.pdf,.jpg,.jpeg,.png` defaults; actual upload and server-side validation are not implemented.
6. The contract is a draft and still requires both route owners to approve it. Category examples must use actual seeded codes such as `AYURVEDA`.
7. `certificate_number` is legacy/internal only and must not be presented as a statutory license, AYUSH approval, or legal certification.
8. The schema lacks activation, uploader, persistent resource, and review timestamp fields; do not assume these are persisted.

## Verification

- `npm run db:validate`, `npm run db:generate`, `npm run db:status`, and `npm run db:seed` passed on 12 November 2026. The seed inserted five missing AYUSH category rows and preserved existing rows. Database credentials are not recorded here.
- Backend JavaScript syntax checks passed. A live PostgreSQL smoke flow passed registration, profile lookup, startup profile upsert, application create/list/detail/history, and submission; the temporary smoke account and its records were removed afterward.
- `npm run build` passed with zero errors in `frontend/`.
- The public static resources route and public/startup page integrations are runtime-verified via `backend/test-resources.js` (11/11 tests passing), verifying pagination envelope (`data.items`, `data.pagination`), category filtering, search, detail lookup, 404s, input validation, and verified destination URLs with zero placeholder `#` links.
- Request validation rejects malformed JSON, non-object JSON bodies, invalid nested application objects, malformed founder entries, invalid founder/profile email formats, invalid category-code types, and values exceeding the mapped database field limits with structured client errors.
- The build completed with dependency and bundle-size warnings; the upload-copy changes added after that build have not been runtime-verified.
- `npm run lint` could not start because ESLint 9 requires an `eslint.config.*` file, which is absent from the repository.
- Browser check confirmed demo startup login, local draft feedback, mock document metadata, and navigation through the wizard to its review step. No backend submission was made.
- The auth API integration was not build- or runtime-verified during the 14 November update.
- The applicant profile/application API integration added in this update was not build- or runtime-verified; no automated tests or production API calls were run for it.
- End-to-end React-to-API integration, document uploads, officer/admin flows, and production deployment remain unverified.

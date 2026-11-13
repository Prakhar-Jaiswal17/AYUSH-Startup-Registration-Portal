# Project Collaborator Responsibilities

**Repository review:** 13 November 2026. This describes the tracked implementation in the shared repository; it cannot account for uncommitted work on a teammate's machine.

The API proposal and endpoint ownership are detailed in [api-contract.md](./api-contract.md). The proposal remains subject to review by the relevant route owners.

## Prakhar

**Implemented in the repository:** shared Prisma client and database connection, JWT authentication middleware, registration/login/profile/logout endpoints, startup profile endpoints, startup application draft/read/update/submit/status-history endpoints, validation, tracking identifiers, ownership rules, and route mounting.

**Remaining:** review and confirm the API contract with Arnav; help run the complete startup-to-officer workflow once Arnav's UI and review APIs are connected; address integration issues in the routes owned here.

## Arnav

**Prepared:** frontend API wrappers exist in `frontend/src/services/api.js` for auth, applications, officer, queries, documents, admin, notifications, resources, and categories. The API wrappers alone do not mean those flows are integrated.

**Remaining:** connect React auth and startup profile/application screens to Prakhar's APIs and replace mock behavior in those flows; implement officer queue, assignment, review, and decision APIs; implement clarification-query and notification APIs; connect officer/admin review screens; collaborate with Prakhar on end-to-end workflow verification.

## Sarth

**Implemented in the repository:** public and startup resources pages consume the resources API, with search, category filtering, pagination, loading/error/empty states. The static resources endpoint and its automated checks are present; the November 13 resource integration commit records 11 passing checks.

**Remaining:** final review of resource titles, summaries, categories, and external destinations; confirm the resource documentation stays aligned with the page and API.

## Work still needing an owner

The current plan does not explicitly assign:

- Document upload, download, and verification APIs and private file storage.
- An AYUSH categories API (the frontend wrapper exists, but no backend route is mounted).
- Admin analytics, user-management, and audit-log APIs and their live UI integration.

Decide whether these are required for the project release and assign owners. Admin review-screen integration is assigned to Arnav. Prakhar owns mounting any routes agreed by the team; coordinate route and contract changes with the relevant owner.

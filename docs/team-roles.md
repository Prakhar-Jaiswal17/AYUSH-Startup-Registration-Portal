# Project Collaborator Responsibilities

**Repository review:** 14 November 2026. This describes the implementation in the shared repository; it cannot account for uncommitted work on a teammate's machine.

The API proposal and endpoint ownership are detailed in [api-contract.md](./api-contract.md). The proposal remains subject to review by the relevant route owners.

## Prakhar

**Implemented in the repository:** shared Prisma client and database connection, JWT authentication middleware, registration/login/profile/logout endpoints, startup profile endpoints, startup application draft/read/update/submit/status-history endpoints, validation, tracking identifiers, ownership rules, and route registration in the Express server.

**Remaining:** review and confirm the API contract with Arnav; help run the complete startup-to-officer workflow with Arnav; address integration issues in the routes owned here.

## Arnav

**Implemented in the repository:** real login, registration, logout, and session restoration use the auth API; API roles are normalized for React, and the bearer token is stored for protected requests. Startup profile display and applicant application list, detail, draft creation/editing, and submission use the backend for live accounts, including server-issued tracking IDs. Startup detail screens support clarification query listing, responding, and resubmitting. Officer accounts load their assigned queue and use the review-start, decision, and clarification APIs; the review screen supports raising and resolving queries. Admin accounts load the non-draft queue, assign officers, and can open the review screen. Startup, officer, and admin sessions load and update notifications through the API. The admin categories screen uses the public category endpoint; admin analytics, startup-user listing, and audit-log screens use protected read-only endpoints. Demo role sign-in and demo workflows remain local.

**Remaining:** run the complete startup-to-officer workflow with Prakhar, including registration/login, application submission, assignment, review, clarification response/resubmission, decision, and notifications. Document upload/verification remains unassigned and requires coordination before its API and storage flow is built. Admin account activation is not supported by the current schema.

## Sarth

**Implemented in the repository:** public and startup resources pages consume the resources API, with search, category filtering, pagination, loading/error/empty states. The static resources endpoint and its automated checks are present; the November 13 resource integration commit records 11 passing checks.

**Remaining:** final review of resource titles, summaries, categories, and external destinations; confirm the resource documentation stays aligned with the page and API.

## Work still needing an owner

The current plan does not explicitly assign:

- Document upload, download, and verification APIs and private file storage.

Decide whether document handling is required for the project release and assign an owner. Prakhar maintains shared route registration; coordinate any future route mounting and contract changes with him and the relevant owner. The category and read-only admin endpoints and their screen integrations are implemented by Arnav; they still need runtime verification against the shared database.

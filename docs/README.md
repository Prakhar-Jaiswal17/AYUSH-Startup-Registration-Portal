# Project Documentation Index

This directory contains the project requirements, design documents, current implementation notes, API proposal, and team assignments. Arnav is handling deployment; deployment is not yet verified in this repository snapshot.

## Current status

The repository has PostgreSQL/Prisma persistence foundations, core auth/startup/application APIs, and resources and AYUSH category APIs. Live applicant flows, officer/admin review flows, notifications, admin analytics, role-filterable user management with account creation/role changes/deletion, audit logs, and the admin categories screen are connected for API sessions. The backend workflow and admin read APIs have passed PostgreSQL smoke checks; the shared browser/UI run is still pending. Resource enhancements add sorting, search highlighting, bookmarking, copy-link, export, and accessibility support. Resource sorting/bookmarks now refresh correctly, exported CSV text is protected from spreadsheet formulas, and the frontend lint check passes. The unused global dashboard search is removed, while resource-page search remains. The API client timeout is 75 seconds. Document upload/verification and account activation remain incomplete. Demo workflows remain local. Electron packages the same React website; its macOS arm64 archive now includes the Users role filter, while GUI runtime, DMG creation, and Windows/Linux installers still need verification. See [implementation-status.md](./implementation-status.md) for details and verification.

## Project and team

| Document | Contents |
|---|---|
| [team-roles.md](./team-roles.md) | Current assignments, completed work, and items needing an owner |
| [implementation-status.md](./implementation-status.md) | Repository snapshot, verified behavior, and remaining integration gaps |
| [api-contract.md](./api-contract.md) | Draft HTTP contract; confirm with route owners before relying on it as final |
| [resources-guide.md](./resources-guide.md) | Directory of official AYUSH portals, regulatory bodies, and resource APIs |
| [../desk_App/README.md](../desk_App/README.md) | Electron desktop setup, development launch, packaging commands, and integration limits |

## Requirements and architecture

| Document | Contents |
|---|---|
| [requirements.md](./requirements.md) | Functional and non-functional requirements and scope |
| [user-roles.md](./user-roles.md) | User roles and intended permissions |
| [application-workflow.md](./application-workflow.md) | Intended application lifecycle and transitions |
| [tech-stack.md](./tech-stack.md) | Technologies and current implementation state |
| [architecture.md](./architecture.md) | Target architecture and what is connected today |

## Database

| Document | Contents |
|---|---|
| [ER-diagram.md](./ER-diagram.md) | Database entities and relationships |
| [database-design.md](./database-design.md) | Relational schema design and decisions |
| [database-workflow.md](./database-workflow.md) | Intended UI-to-data mapping and transaction boundaries; distinguish planned flows from implemented endpoints |
| [../database/README.md](../database/README.md) | PostgreSQL, Prisma migration, and seed setup instructions |

The Prisma schema and migration history are under `backend/prisma/`. Commit migrations; do not commit `.env` files, database URLs, or `node_modules`.

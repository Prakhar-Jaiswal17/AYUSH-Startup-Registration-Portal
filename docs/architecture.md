# System Architecture

## Target architecture

The target system has three main layers: a React website (also opened by Electron), a Node.js/Express API, and PostgreSQL accessed through Prisma. Private file storage is a planned capability.

```mermaid
flowchart LR
  Browser[Browser: React + Vite] -->|HTTP JSON| API[Express API]
  Electron[Electron development launcher] --> Browser
  API --> Prisma[Prisma Client]
  Prisma --> DB[(PostgreSQL)]
  API -. planned .-> Files[Private document storage]
```

## Current implementation

- **Website:** Public and startup pages for resources consume the backend resources API. Real login, registration, logout, and session restoration use the backend auth API; demo role sign-in remains local. Live startup accounts load their profile and application list/detail from the API and create, edit, and submit drafts through it. API officers load their assigned review queue; admins load the non-draft queue, assign officers, and can open review screens. Review start and approve/reject actions use the API. Clarification APIs are implemented but the officer/applicant screens do not call them yet. Demo workflows remain local; document actions and notification screens are not connected.
- **Electron:** Opens the same website in a native window and reuses its routes and behavior. It is a development launcher, not a packaged desktop release.
- **API:** Express routes cover health, bcrypt/JWT auth, startup profile read/create/update, startup application draft/read/update/submit/status history, officer/admin review queues, officer listing for assignment, application assignment, review start and decision, and static public resources.
- **Persistence:** The auth/startup/application endpoints use the shared Prisma client and PostgreSQL. Resource content is currently static in the resources route rather than stored in the database.
- **File storage:** There is no server-side upload/download implementation yet.

The backend routes exist independently of the React contexts. The connected website uses the auth, startup, application, resources, and officer/admin review routes described above. Clarification routes exist but are not integrated with React; notification, document, admin account-management, and analytics workflows remain incomplete. See [implementation-status.md](./implementation-status.md) for checks and remaining work.

## Layer responsibilities

### Frontend and desktop

React renders the public and role-specific screens and sends HTTP requests through the Axios service where integrations exist. Client-side route guards support navigation but are not an authorization boundary. Electron loads the website; it does not implement a separate backend or database layer.

### API

Express handles HTTP requests, validation, authentication, authorization, and workflow rules. Implemented endpoint prefixes include `/api/auth`, `/api/startups`, `/api/applications`, `/api/officer`, `/api/queries`, and `/api/resources`. Assignment, review-start, decision, and query actions are mounted under their documented `/api` paths. Notification, document, admin account-management, and category routes are not complete.

### Database and file storage

PostgreSQL is modeled by `backend/prisma/schema.prisma`; versioned Prisma migrations are the reproducible schema setup. The SQL scripts under `database/` are standalone DBMS materials. Uploaded documents are intended for private storage with metadata in PostgreSQL, but that feature is not implemented.

## Domain boundary

The portal records application workflow outcomes. It does not issue statutory AYUSH licences, official regulatory approvals, or legal certifications.

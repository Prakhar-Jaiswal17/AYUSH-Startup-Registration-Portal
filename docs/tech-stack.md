# Technology Stack

The project uses JavaScript throughout; TypeScript is not part of the plan.

## Stack

| Layer | Technology | Current use |
|---|---|---|
| Website | React 19, Vite, React Router, Tailwind CSS, Axios | Public/startup resources and live applicant profile/application flows call the API. Officer/admin queue, assignment, review-start, decision, clarification, and notification workflows are connected for API sessions. Demo accounts remain local. Document workflows are unconnected. |
| Desktop | Electron and electron-builder | Opens the same React/Vite website in development and packages its built assets for macOS, Windows, and Linux. The API and database are run separately. |
| API | Node.js, Express 5, JavaScript CommonJS | Health, authentication, startup profile/application, officer/admin review queue, officer assignment, review-start, decision, clarification query, notification, and resources endpoints. |
| Database | PostgreSQL | Relational persistence matching the agreed SQL design. |
| ORM and migrations | Prisma 7 | JavaScript client via shared PostgreSQL adapter; schema, migrations, and category seed command. |
| Authentication | bcryptjs and JSON Web Tokens | Password hashing and token-based API authentication are implemented and connected to live frontend authentication. Demo role sign-in remains local. |
| Backend validation | Express route validation and shared HTTP helpers | Request checks in implemented routes; there is no backend Zod integration. Zod is present as a frontend dependency. |

## Current integration

- `frontend/src/services/api.js` holds Axios wrappers. Auth, startup profile, application, officer review, clarification, notification, resources, category, admin analytics, user listing, and audit-log wrappers are consumed by live frontend flows. Document upload/verification and account activation are not implemented.
- `AuthContext` uses the backend for real login, registration, logout, session restoration, and startup profile loading. `ApplicationContext` loads live applicant applications or reviewer queues and supports startup draft/submission and reviewer assignment/review/decision actions. `NotificationContext` loads server notifications for API sessions and uses local storage for demo sessions.
- Backend environment settings, including `DATABASE_URL`, belong in `backend/.env`. Keep real `.env` files private. Frontend `VITE_*` values are exposed to the browser and must not contain secrets.
- The Electron launcher loads the website and therefore inherits whichever website integrations are active.
- Desktop commands and requirements are documented in [desk_App/README.md](../desk_App/README.md). Packaging builds the frontend into `desk_App/web-dist/` without modifying its source.

## Security and domain constraints

- Store only password hashes, never plaintext passwords.
- Enforce authentication, record ownership, and role permissions on the server. Frontend route guards are for navigation, not security.
- Uploaded files must eventually use private storage with authorized access; server-side file storage is not implemented yet.
- Portal application states must not be described as statutory AYUSH licences, government approvals, or legal certifications.

See [implementation-status.md](./implementation-status.md) for the dated verification snapshot.

# Technology Stack

The project uses JavaScript throughout; TypeScript is not part of the plan.

## Stack

| Layer | Technology | Current use |
|---|---|---|
| Website | React 19, Vite, React Router, Tailwind CSS, Axios | Role-based prototype screens; public and startup resources pages call the API. Most workflow contexts/pages remain mock-backed. |
| Desktop | Electron | Development launcher for the same React/Vite website; not a separately implemented or packaged application. |
| API | Node.js, Express 5, JavaScript CommonJS | Health, authentication, startup profile, core application, and resources endpoints. |
| Database | PostgreSQL | Relational persistence matching the agreed SQL design. |
| ORM and migrations | Prisma 7 | JavaScript client via shared PostgreSQL adapter; schema, migrations, and category seed command. |
| Authentication | bcryptjs and JSON Web Tokens | Password hashing and token-based API authentication are implemented. Frontend authentication is not yet connected. |
| Backend validation | Express route validation and shared HTTP helpers | Request checks in implemented routes; there is no backend Zod integration. Zod is present as a frontend dependency. |

## Current integration

- `frontend/src/services/api.js` holds Axios wrappers. The resource API wrappers are consumed by the public and startup resource pages; other wrappers are prepared but their workflows are not yet connected.
- `AuthContext`, `ApplicationContext`, and `NotificationContext` still use mock data/browser storage for the main application flows.
- Backend environment settings, including `DATABASE_URL`, belong in `backend/.env`. Keep real `.env` files private. Frontend `VITE_*` values are exposed to the browser and must not contain secrets.
- The Electron launcher loads the website and therefore inherits whichever website integrations are active.

## Security and domain constraints

- Store only password hashes, never plaintext passwords.
- Enforce authentication, record ownership, and role permissions on the server. Frontend route guards are for navigation, not security.
- Uploaded files must eventually use private storage with authorized access; server-side file storage is not implemented yet.
- Portal application states must not be described as statutory AYUSH licences, government approvals, or legal certifications.

See [implementation-status.md](./implementation-status.md) for the dated verification snapshot.

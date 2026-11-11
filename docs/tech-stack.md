# Technology Stack

## Application stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Vite, React, JavaScript | Browser interface and role-specific pages |
| Backend | Node.js, Express, JavaScript (CommonJS) | REST API, validation, authentication, and workflow rules |
| Database | PostgreSQL | Persistent relational data |
| ORM | Prisma | Database schema, migrations, and JavaScript database client |
| Styling and UI | Tailwind CSS, Lucide, Framer Motion | Presentation, icons, and interface transitions |
| Forms | React Hook Form and Zod | Client-side form state and validation |

JavaScript is used throughout; TypeScript is not planned. The frontend and backend are separate applications in the target architecture. The browser will call the Express API over HTTP, and the backend will connect to PostgreSQL through Prisma once those integrations are implemented.

## Current implementation

- The frontend package includes React 19, Vite 6, Tailwind CSS v4, Axios, React Router, React Hook Form, Zod, and the UI libraries above. The current seven-step application form is implemented with React state; it does not yet use React Hook Form or Zod.
- `frontend/src/services/api.js` uses `VITE_API_URL` and falls back to `http://localhost:3005/api`. API wrappers and centralized error handling are prepared, but the contexts and screens remain mock-backed.
- The CommonJS Express server currently exposes only `GET /api/health` on port `3005`. Auth and business routes are not implemented.
- The Prisma 7 configuration and PostgreSQL datasource are present, but `schema.prisma` has no models. The SQL scripts in `database/` are separate and have not been connected to Prisma.
- Frontend and backend example environment files are present. Keep real `.env` files uncommitted; only public frontend configuration such as `VITE_API_URL` belongs in the frontend environment.

## Development configuration

- Backend settings, including `DATABASE_URL`, belong in `backend/.env` and must not be committed.
- `backend/.env.example` documents the required backend settings using placeholders.
- The frontend uses `VITE_API_URL` to locate the backend. Frontend environment variables are public in the browser and must not contain secrets.
- Prisma schema and migrations live under `backend/prisma/`.

## Security principles

- Hash passwords before storage.
- Enforce authentication, ownership, and role permissions in Express routes or middleware.
- Validate incoming data on the server; client validation is only for usability.
- Store uploaded documents in private storage and authorize each download.
- Record important workflow transitions and administrative actions.
- Do not present a portal status, recognition, or certificate as a statutory AYUSH license or regulatory approval issued by an authority.

For the complete implementation snapshot and contract/database differences, see [implementation-status.md](./implementation-status.md).

# AYUSH Startup Registration Portal

An academic prototype for handling AYUSH startup application intake and review. It is built as part of the Advanced Software Development and Database Management Systems curriculum. This repository is not an official Ministry of AYUSH or All India Institute of Ayurveda service.

The project contains a React website, a development Electron launcher, an Express API, and a PostgreSQL database managed with Prisma. See [docs/implementation-status.md](./docs/implementation-status.md) for the current verified implementation and [docs/team-roles.md](./docs/team-roles.md) for the team's remaining work.

## Current implementation

- **Database:** PostgreSQL design mapped to Prisma models and versioned migrations. The backend has a Prisma seed command for missing AYUSH category rows. See [database setup](./database/README.md).
- **Backend:** CommonJS Express API with health, bcrypt/JWT authentication, startup profile, core application draft/read/update/submit/status-history, and public static resources routes.
- **Website:** Public and startup resource pages use the backend resources API, including loading/error/empty states, search, category filtering, and pagination. Most authentication, profile, application, document, officer, and admin screens still use mock data or are not connected to backend workflows.
- **Desktop:** Electron opens the same React/Vite website in a native window. It is a development launcher, not a packaged installer, and inherits the website's current mock-backed workflows.

The portal may record an application's workflow status. It does not issue statutory AYUSH licences, regulatory approvals, or legal certifications.

## Technology

- Frontend: React 19, Vite, JavaScript, Tailwind CSS, React Router, Axios
- Desktop: Electron
- Backend: Node.js, Express 5, JavaScript CommonJS, bcryptjs, JWT
- Database: PostgreSQL with Prisma 7

## Repository layout

```text
frontend/       React/Vite website
backend/        Express API, Prisma schema, migrations, seed, and API checks
desk_App/       Electron development launcher
database/       Standalone PostgreSQL schema, seed, queries, and setup guide
docs/           Requirements, architecture, workflow, API contract, and status
```

## Run locally

Install dependencies in `backend/` and `frontend/`. Configure `backend/.env` using `backend/.env.example`; keep real environment files and credentials out of Git. Set `VITE_API_URL` in the frontend environment if the API is not at its default `http://localhost:3005/api`.

Start the backend:

```bash
cd backend
npm install
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Start the website in another terminal:

```bash
cd frontend
npm install
npm run dev
```

For desktop setup and launch instructions, see [desk_App/README.md](./desk_App/README.md). The frontend and desktop launcher currently need frontend dependencies installed separately.

## Documentation

- [Documentation index](./docs/README.md)
- [Team responsibilities and unassigned scope](./docs/team-roles.md)
- [Implementation status and verification](./docs/implementation-status.md)
- [Draft API contract](./docs/api-contract.md)
- [Database setup](./database/README.md)

The API contract remains a draft and should be confirmed by the route owners before treating it as the final integration agreement. Preserve the existing PostgreSQL/Prisma design unless the team explicitly agrees to a schema change.

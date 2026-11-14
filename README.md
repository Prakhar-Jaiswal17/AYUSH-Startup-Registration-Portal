# AYUSH Startup Registration Portal

An academic prototype for handling AYUSH startup application intake and review. It is built as part of the Advanced Software Development and Database Management Systems curriculum. This repository is not an official Ministry of AYUSH or All India Institute of Ayurveda service.

The project contains a React website, a packaged Electron desktop app, an Express API, and a PostgreSQL database managed with Prisma. Arnav is handling deployment. See [docs/implementation-status.md](./docs/implementation-status.md) for the current verified implementation and [docs/team-roles.md](./docs/team-roles.md) for the team's remaining work.

## Current implementation

- **Database:** PostgreSQL design mapped to Prisma models and versioned migrations. The backend has a Prisma seed command for missing AYUSH category rows. See [database setup](./database/README.md).
- **Backend:** CommonJS Express API with health, bcrypt/JWT authentication (30-day sign-in sessions), startup profile and application workflows, officer review, clarification queries, notifications, categories, admin account management, audit logs, and public static resources. Account role changes and deletions are checked against the database on authenticated requests.
- **Website:** Live API sessions use backend auth, startup profile/application flows, officer/admin review, queries, notifications, categories, admin account creation, role filtering, role changes, deletion, and reporting screens. The resource area includes search highlighting, filters, working sort controls, bookmarks, copy-link, and CSV/JSON export. The unused global dashboard search was removed; resource-page search remains available. Demo role sign-in and demo workflows remain local. Document upload/verification is not connected.
- **Desktop:** Electron packages and opens the same React website in a native window. A macOS Apple Silicon ZIP was built with the deployed Render API address and opened successfully through the home, sign-in, and demo startup dashboard. Windows/Linux packaging scripts are available but those builds remain pending. The Express API and PostgreSQL run separately.

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
desk_App/       Electron desktop app and packaging configuration
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

For desktop setup, development launch, and packaging instructions, see [desk_App/README.md](./desk_App/README.md). The frontend dependencies must be installed separately before building the desktop package.

## Documentation

- [Documentation index](./docs/README.md)
- [Team responsibilities and unassigned scope](./docs/team-roles.md)
- [Implementation status and verification](./docs/implementation-status.md)
- [Draft API contract](./docs/api-contract.md)
- [Database setup](./database/README.md)

The API contract remains a draft and should be confirmed by the route owners before treating it as the final integration agreement. The backend environment example uses the Cloudflare Pages site origin for CORS; keep real database credentials and signing keys in private environment settings, never in committed examples. Arnav is responsible for deployment. Preserve the existing PostgreSQL/Prisma design unless the team explicitly agrees to a schema change.

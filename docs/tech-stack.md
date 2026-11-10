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

The frontend and backend are separate applications. The browser calls the Express API over HTTP; only the backend connects to PostgreSQL through Prisma. JavaScript is used throughout. No TypeScript is planned or required.

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

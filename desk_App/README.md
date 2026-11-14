# AYUSH Setu Desktop

An Electron desktop version of the AYUSH Startup Registration Portal. Electron opens the existing React website in a desktop window and starts its Vite development server automatically. The website source remains in `frontend/` and is not modified by this desktop setup.

## Current scope

- The same public pages, startup registration, and application screens as the website.
- The same startup, officer, and admin demo sign-in flows and dashboards.
- Live API-backed account flows wherever the website supports them; demo accounts and demo workflows continue to use local browser storage.
- A native Electron window with context isolation and Node integration disabled.

The Express backend implements bcrypt/JWT authentication, startup profile and core application APIs, officer review, clarification queries, notifications, categories, read-only admin routes, and public static resources. The website uses these APIs for real accounts; demo accounts remain local. Document upload and verification are not connected. The desktop app inherits the website's behavior and is a development launcher, not a packaged installer. The portal does not issue statutory AYUSH licences or approvals.

## Run locally

Requires Node.js and npm. From this directory:

```bash
npm install
npm start
```

The desktop app starts the website's Vite server on `127.0.0.1:5173` and opens it in Electron. Frontend dependencies must already be installed in `frontend/` (`npm install` there, if needed). Close Electron to stop the Vite server it started. If the website is already running on that address, Electron reuses it.

Use the Demo buttons for local mock accounts. For live API testing, register or sign in with an account stored in PostgreSQL; officer and admin accounts must already exist in the database. Live application data is persisted through the backend, but document uploads are not available yet.

## Security notes

Electron uses context isolation, a sandboxed renderer, and disabled Node integration. The website renderer has no direct Node or filesystem access. Its demo data uses Chromium browser storage, as it does in the website.

## Next steps

Run the full live startup-to-officer flow and verify admin/category screens against the configured database. Assign document upload and verification if required for the release. Electron inherits website changes because it displays the same React app; keep its frontend origin allowed by backend CORS.

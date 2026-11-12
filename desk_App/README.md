# AYUSH Setu Desktop

An Electron desktop version of the AYUSH Startup Registration Portal. Electron opens the existing React website in a desktop window and starts its Vite development server automatically. The website source remains in `frontend/` and is not modified by this desktop setup.

## Current scope

- The same public pages, startup registration, and application screens as the website.
- The same startup, officer, and admin demo sign-in flows and dashboards.
- The same React routes, mock data, and browser-storage behavior.
- A native Electron window with context isolation and Node integration disabled.

The Express backend now implements `GET /api/health`, bcrypt/JWT authentication, startup profile APIs, core application draft/read/update/submit/status-history APIs, and public static resources. Document upload, query, officer, notification, admin, and category APIs remain unfinished. The React auth and application contexts are still mock-backed and do not call the implemented backend routes, so the desktop app also uses the website's mock/demo behavior and does not synchronize records with PostgreSQL. The portal does not issue statutory AYUSH licences or approvals.

## Run locally

Requires Node.js and npm. From this directory:

```bash
npm install
npm start
```

The desktop app starts the website's Vite server on `127.0.0.1:5173` and opens it in Electron. Frontend dependencies must already be installed in `frontend/` (`npm install` there, if needed). Close Electron to stop the Vite server it started. If the website is already running on that address, Electron reuses it.

Sign-in and registration have the same demo behavior as the website. Backend auth and core application APIs are available for direct API testing, but the website and desktop UI are not connected to them yet. Application data remains mock/local and is not synchronized with PostgreSQL.

## Security notes

Electron uses context isolation, a sandboxed renderer, and disabled Node integration. The website renderer has no direct Node or filesystem access. Its demo data uses Chromium browser storage, as it does in the website.

## Next integration step

Next, connect the website's auth, application, and startup contexts to the implemented APIs. Then add the remaining document/query/officer/admin APIs and their UI integrations. Electron will inherit those changes because it displays the same React website; confirm the desktop origin remains allowed by backend CORS.

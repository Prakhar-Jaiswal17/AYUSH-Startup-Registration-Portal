# AYUSH Setu Desktop

An Electron desktop version of the AYUSH Startup Registration Portal. Electron opens the existing React website in a desktop window and starts its Vite development server automatically. The website source remains in `frontend/` and is not modified by this desktop setup.

## Current scope

- The same public pages, startup registration, and application screens as the website.
- The same startup, officer, and admin demo sign-in flows and dashboards.
- The same React routes, mock data, and browser-storage behavior.
- A native Electron window with context isolation and Node integration disabled.

The current Express backend implements only `GET /api/health`. Authentication, application, document, and review endpoints are not implemented yet. The desktop app therefore inherits the website's mock/demo behavior; it does not save records through the API or submit applications to a government authority. This portal does not issue statutory AYUSH licences or approvals.

## Run locally

Requires Node.js and npm. From this directory:

```bash
npm install
npm start
```

The desktop app starts the website's Vite server on `127.0.0.1:5173` and opens it in Electron. Frontend dependencies must already be installed in `frontend/` (`npm install` there, if needed). Close Electron to stop the Vite server it started. If the website is already running on that address, Electron reuses it.

Sign-in and registration have the same demo behavior as the website. Business API routes are not implemented yet, so application data remains mock/local and is not synchronized with PostgreSQL.

## Security notes

Electron uses context isolation, a sandboxed renderer, and disabled Node integration. The website renderer has no direct Node or filesystem access. Its demo data uses Chromium browser storage, as it does in the website.

## Next integration step

When backend business routes and authentication are implemented, connect the website's existing API client and confirm the desktop origin is allowed by backend CORS.

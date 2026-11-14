# AYUSH Setu Desktop

AYUSH Setu Desktop is the Electron desktop edition of the existing React portal. It displays the same application screens and uses the same backend API. There is one frontend codebase: this folder wraps and packages `../frontend` without changing its source files.

## Requirements

- Node.js and npm
- Install frontend dependencies once from `../frontend` with `npm install`
- For real registration, sign-in, and saved records: start the PostgreSQL database and Express backend as described in the root README and backend documentation

The packaged desktop app includes the built React website, but does not bundle PostgreSQL or the Express backend. It can open the site without the backend, but live data features require the backend to be running at the API address configured when the website is built. Demo flows use the same browser-based demo data as the website. The portal is an application and review workflow; it does not issue statutory AYUSH licences or approvals.

## Run the desktop app during development

In a terminal, go to this folder and run:

```bash
npm install
npm start
```

Electron starts the Vite server for `../frontend` on `127.0.0.1:5173` and opens it in a desktop window. It reuses an existing AYUSH Vite server at that address. If an unrelated service is using the port, close that service and try again. Closing the desktop app stops the Vite process that Electron started.

## Build an installable app

Build on the operating system you want to distribute for. First install frontend dependencies as above, then install Electron's packaging dependencies in this folder:

```bash
npm install
```

On macOS (creates a ZIP containing the `.app`):

```bash
npm run dist:mac
```

To create a DMG disk image instead, run `npm run dist:mac:dmg`. DMG creation requires macOS disk image support; the automated build environment used for this project could not create one, so the ZIP is the verified macOS artifact.

On Windows:

```bash
npm run dist:win
```

On Linux:

```bash
npm run dist:linux
```

Installers and archives are written to `desk_App/release/`. The website build is generated in the ignored `desk_App/web-dist/` folder and copied into the desktop package. `npm run pack` creates an unpacked test build. `npm run dist` builds a package for the current operating system.

For a demo with working live data, start PostgreSQL and the backend first, then open the desktop application. Ensure the backend CORS configuration allows `http://127.0.0.1:5173` and that the frontend build points to the correct API URL. Do not put database passwords, signing keys, or other secrets in the frontend environment: frontend build variables are included in the app and visible to users.

## Desktop behavior and security

- The desktop app loads the same React website as the browser version.
- The renderer has context isolation and sandboxing enabled, with Node integration disabled.
- External HTTPS links open in the system browser; navigation away from the local portal is blocked inside the app.
- The production desktop app serves the built website only on the loopback interface at port 5173, matching the backend's existing CORS allowlist.
- Existing `index.html`, `renderer.js`, and `styles.css` files are an earlier standalone mockup. The current Electron launcher does not load them; the packaged app uses the React site instead.

## Current integration limits

Desktop screens and workflows match the current website. The desktop packaging does not add separate backend features. Any limitation in the web app or API (including document upload/verification, if not implemented there) also applies in the desktop app. Validate startup, officer, and admin flows against the team's running database before presenting or distributing the app.

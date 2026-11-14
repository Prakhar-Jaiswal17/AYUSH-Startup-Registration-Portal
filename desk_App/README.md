# AYUSH Setu Desktop

AYUSH Setu Desktop is the Electron desktop edition of the existing React portal. It displays the same application screens and uses the same backend API. There is one frontend codebase: this folder wraps and packages `../frontend` without changing its source files.

## Requirements

- Node.js and npm
- Install frontend dependencies once from `../frontend` with `npm install`
- For real registration, sign-in, and saved records: start the PostgreSQL database and Express backend as described in the root README and backend documentation

The packaged desktop app includes the built React website, but does not bundle PostgreSQL or the Express backend. Live data features require the backend to be running at the API address configured when the website is built. Demo flows use the same browser-based demo data as the website. The portal is an application and review workflow; it does not issue statutory AYUSH licences or approvals.

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

On Windows (the configured build target is x64):

```bash
npm run dist:win
```

On Linux:

```bash
npm run dist:linux
```

Installers and archives are written to `desk_App/release/`. The website build is generated in the ignored `desk_App/web-dist/` folder and copied into the desktop package. `npm run pack` creates an unpacked test build. `npm run dist` builds a package for the current operating system.

## Select the API address for a packaged build

The desktop package embeds the React build, including its API address. The default is `http://localhost:3005/api`, which is suitable only when the backend is running on the same computer. Arnav provided the deployed API address `https://ayush-startup-registration-portal.onrender.com/api`. To rebuild a desktop release with that API, set `VITE_API_URL` before running the packaging command. For example, in the terminal used to package the app:

```bash
export VITE_API_URL=https://ayush-startup-registration-portal.onrender.com/api
npm run dist:mac
```

Use the platform's matching package command on Windows or Linux. Do not put `DATABASE_URL`, `JWT_SECRET`, or other server secrets in `VITE_API_URL` or any frontend build setting: values included in the desktop app can be inspected by its users. The deployed API must allow the desktop app's loopback origin `http://127.0.0.1:5173` through CORS.

For local development, start PostgreSQL and the backend first, then open the desktop app with `npm start`. Ensure the API is available at the configured URL. Arnav's website deployment and the desktop package are separate; Cloudflare Pages does not publish the Electron installer.

## Desktop behavior and security

- The desktop app loads the same React website as the browser version.
- The renderer has context isolation and sandboxing enabled, with Node integration disabled.
- External HTTPS links open in the system browser; navigation away from the local portal is blocked inside the app.
- The production desktop app serves the built website only on the loopback interface at port 5173, matching the backend's existing CORS allowlist.
- The macOS Apple Silicon app was opened and checked through the home page, sign-in page, and demo startup dashboard. The Windows x64 installer was built and its architecture and embedded API URL were inspected, but it needs to be opened on a Windows computer. Live authenticated API actions have not yet been verified.

## Current integration limits

Desktop screens and workflows match the current website. The desktop packaging does not add separate backend features. Any limitation in the web app or API (including document upload/verification, if not implemented there) also applies in the desktop app. The current macOS ZIP and Windows x64 installer are unsigned; the Mac ZIP is not notarized. Live API login still needs a full end-to-end check before distribution. Linux package has not been built.

# Project Collaborator Responsibilities

**Current plan:** 12 November 2026

This document records the current division of project work among Prakhar, Arnav, and Sarth. The API-specific route assignments are summarized in [api-contract.md](./api-contract.md).

## Prakhar

- Maintain the shared Prisma client, authentication middleware, and JWT handling.
- Implement registration, login, profile, and logout APIs.
- Implement startup profile APIs.
- Implement startup application draft, read, update, and submit APIs, including tracking IDs, validation, and ownership checks.
- Maintain route mounting in `backend/src/server.js`.
- Coordinate the API contract with Arnav before either builds against a changed contract.

## Arnav

- Connect the React login and registration flows to Prakhar's authentication APIs.
- Connect startup application and profile screens to Prakhar's APIs, replacing mock behavior in those connected flows.
- Implement officer application queue, assignment, review, and decision APIs.
- Connect officer and admin review screens to those APIs.
- Implement clarification-query APIs and connect applicant and officer query screens.
- Implement notification APIs and connect the notification screens.
- Test the complete startup-to-officer workflow with Prakhar.

## Sarth

- Review and improve the static resource list, including titles, summaries, categories, and links.
- Connect the public resources page to the existing public resources API when Arnav's core integration is on track.
- Add loading, empty, and error states to the public resources page.
- Verify resource search, category filtering, and external links.
- Update the resource documentation.

## Work still needing an owner

The current plan does not explicitly allocate document upload and verification APIs, the AYUSH categories API, or the admin analytics, user-management, and audit-log APIs. Confirm ownership for these items before implementation. Admin review-screen integration remains assigned to Arnav.

The public static resources endpoint already exists in `backend/src/routes/resources.js`. Sarth's resource work covers its curated content and public-page integration. Prakhar maintains route mounting in `backend/src/server.js`; coordinate any mounting changes with him.

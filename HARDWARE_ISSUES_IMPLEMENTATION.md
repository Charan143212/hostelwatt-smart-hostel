# Hardware issue API implementation

## Implemented

- `POST /api/hardware-issues` validates hostel, room, reported_by, issue_type,
  description; generates a server UUID; sets OPEN and equal server epoch-ms
  timestamps; writes to `hardware_reports/{report_id}` in Firebase RTDB.
- `GET /api/hardware-issues` reads persistent reports and supports optional
  hostel/room filters, within the caller's verified institutional assignment.
- `PATCH /api/hardware-issues/:id` permits only status and/or description, updates
  updated_at, and reads the stored result back. Missing reports return 404.
- Supported types: Power Sensor, Occupancy Sensor, Automatic Power Control,
  Room Telemetry, Other. Supported statuses: OPEN, IN_PROGRESS, RESOLVED.
- Validation and errors are structured JSON. Responses are not cached.
- Missing server credentials return 503 `FIREBASE_NOT_CONFIGURED`. Firebase
  authentication or database failures return 502, not simulated success.

The implementation uses the existing TypeScript TanStack Start server foundation,
not a separately hosted Node.js process. No Cloud data/auth API is used.

## Security

No anonymous report reads/writes are allowed once Firebase is configured.
The existing client-side login session is not a verified server identity, so API
callers authenticate separately using HTTPS Basic credentials and the
`X-HostelWatt-Role` header. The server checks existing Firebase student/warden
records and derives assignments there. No browser localStorage claim is trusted.
Frontend login itself remains unchanged and is not connected to these APIs yet.

Students submit only as themselves for their assigned room and read reports for
that room. Administrators read/update only their assigned hostel's reports.
Credential records and tokens are never returned or logged. RTDB writes are
restricted to individual hardware report paths; existing room/hostel records are
read neither for migration nor modification. The current plaintext-compatible
password storage is not migrated by this task.

Server secrets required: `FIREBASE_SERVICE_ACCOUNT_EMAIL` and
`FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY`. Neither is currently configured. No
service-account JSON or private key was added to application source.

## Verification results

- Ran all tests with `bunx vitest run`: **4 test files, 39 tests passed**.
- Tests cover required fields, every supported issue type/status, server UUIDs
  and timestamps, filtering, update restrictions, readback, missing IDs,
  assignment authorization, invalid credentials, invalid JSON/query input,
  missing configuration and failed storage.
- Live GET, valid POST and valid PATCH all returned **503** with the explicit
  configuration error; invalid POST returned **400** with the five missing fields.
- Automatic verification reported **build OK** after changes. Manual production
  builds/typechecks are delegated to the environment's automatic harness; no
  independent typecheck or manual production build is claimed.
- Existing routing tests still emit empty-link warnings; they pass.
- Real Firebase create/read/update verification is **blocked by missing server
  credentials**. Test adapters are isolated unit-test machinery, not proof of
  real persistence. No live successful Firebase operation is claimed.

## Exact application/document file changes

Created:

1. `src/routes/api/hardware-issues.ts`
2. `src/routes/api/hardware-issues.$id.ts`
3. `src/server/types/hardware-issues.ts`
4. `src/server/firebase/rest.server.ts`
5. `src/server/services/api-error.server.ts`
6. `src/server/services/hardware-auth.server.ts`
7. `src/server/services/hardware-issues.server.ts`
8. `src/server/routes/hardware-issues.server.ts`
9. `src/server/hardware-issues.test.ts`
10. `HARDWARE_ISSUES_IMPLEMENTATION.md`

Modified:

1. `AGENTS.md`: persistence and API authorization architecture rules.
2. `src/server/README.md`: API contract, secure access and configuration guidance.
3. `roadmap.md`: completed tasks and credential blockers.
4. `src/routeTree.gen.ts`: regenerated automatically for the two new API routes;
   not manually edited.

Private assistant memory `mem://constraints/backend-foundation` was updated to
record the requested report constraints. It is not browser application source.

## Preservation confirmation

- **No mock hardware issue data was added to Firebase or runtime code.** Literal
  reports exist only as isolated unit-test fixtures; no seeds or fallbacks exist.
- **No existing student/admin login, dashboard, reporting UI, theme, page routing,
  telemetry/history or frontend Firebase integration was changed.**
- **No existing hostel/room data structure was changed.**
- No contact details were invented, no migration was performed, no existing Cloud
  scaffold was removed, and no Cloud report storage/auth was introduced.
- Existing login tests pass. A live institutional login was not exercised because
  login behavior is outside this backend-only task.

Next prerequisite: configure the secure Firebase service-account credentials,
then verify real create/read/update before connecting the reporting UI.
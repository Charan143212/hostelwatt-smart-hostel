# HostelWatt server foundation

This TypeScript layer uses the existing TanStack Start hosted server. It does not
start a separate Express/Node process. Web-standard fetch and Web Crypto keep
Firebase server access compatible with the production runtime.

- `routes/`: server-only HTTP response handlers.
- `services/`: internal server-only operations.
- `firebase/`: authenticated Firebase RTDB REST access.
- `types/`: shared type definitions without credentials or side effects.

`GET /api/health` returns `{ "status": "ok", "service": "HostelWatt API" }`.
It checks the server only, not Firebase readiness. The exact requested route is
retained; published site-level access settings may protect `/api/health`.

`checkFirebaseConnectivity()` is an internal, read-only service, not a public
endpoint. It returns only `ok`, `not_configured`, or `unavailable`, never database
records or provider error details. Future authorized server handlers can call it.

## Server credentials

Configure these through secure project secrets, never through a committed `.env`,
frontend `VITE_*` variables, or a checked-in service-account JSON:

- `FIREBASE_PROJECT_ID` (`hostelwatt`)
- `FIREBASE_CLIENT_EMAIL` (service-account `client_email`)
- `FIREBASE_PRIVATE_KEY` (service-account `private_key`, PKCS#8 PEM; escaped newlines converted to actual newlines)
- `FIREBASE_DATABASE_URL` (`https://hostelwatt-default-rtdb.asia-southeast1.firebasedatabase.app`)

Configuration is read only inside a server-only function at request time and
validated against the existing project and database. The hosted environment does
not support the Node-only Firebase Admin SDK. This service therefore retains
authenticated REST with Web Crypto rather than installing an incompatible SDK.
The earlier `FIREBASE_SERVICE_ACCOUNT_*` names are no longer used.

Use a service account for the existing Firebase project with only the permissions
required to read credentials and read/write hardware reports. The service mints a short-lived Google OAuth token on
the server, then sends it only in the Firebase request's Authorization header.
All four secrets are configured securely. Real server authentication and report
read/write/patch/readback passed, and the temporary verification report was
deleted with a confirmed null readback. Do not weaken Firebase rules to test.

The existing browser Firebase client, data layout, auth, telemetry/history,
reporting button, and Cloud scaffold remain unchanged. Writes are confined to the
new `hardware_reports` collection; no existing room or hostel data is modified.

## Hardware report API

- `POST /api/hardware-issues`: JSON hostel, room, reported_by, issue_type,
  description. Returns HTTP 201 `{ report: { id, ...storedFields } }` only after
  Firebase confirms the write. Status is OPEN; timestamps are server epoch milliseconds.
- `GET /api/hardware-issues?hostel=MH6&room=814`: returns `{ reports: [...] }`.
  Filters are optional; verified institutional assignment still scopes results.
- `PATCH /api/hardware-issues/:id`: accepts status and/or description, updates
  updated_at, and returns the persisted report read back from Firebase.

No reports are seeded. Empty lists are returned only after a successful Firebase
read of an empty collection. Missing credentials return HTTP 503 with code
`FIREBASE_NOT_CONFIGURED`; upstream failures return 502, never fake success.

### Access protection (frontend not connected yet)

The existing browser session is not a signed server session. API callers must
therefore supply `Authorization: Basic <base64(identity:password)>` over HTTPS
and `X-HostelWatt-Role: student` or `admin`. These are the existing institutional
credentials, verified server-side against `credentials/students` or
`credentials/wardens`. Do not log headers, embed passwords in URLs, or commit
requests containing credentials. Never use demo login records for these APIs.

Students may create reports only as themselves for their assigned room and read
that room's reports. Administrators may read and update reports only in their
assigned hostel. Roles and assignments come from verified credential records,
not client claims. Authentication data is never returned. The existing UI login
flow and password records are not changed by this API foundation.

Validation rejects missing/blank fields, unsupported types/statuses, unknown
fields, invalid Firebase key characters, empty patches and bodies over 32 KiB.
Report descriptions are limited to 4000 characters. Query filtering currently
reads the report collection server-side and filters it without requiring new
Firebase indexes; add indexed pagination before high-volume use. No cross-origin
access is enabled. Consider rate limiting before external/public API exposure.

Run `bunx vitest run` for all tests. The in-memory adapter in
`hardware-issues.test.ts` is isolated test machinery, not a runtime fallback or
mock database seed. Opt-in live service tests:
`RUN_FIREBASE_INTEGRATION=true RUN_FIREBASE_WRITE_VERIFICATION=true bunx vitest run`.
The write check deletes only its own generated temporary path in a finally block.
Authenticated HTTP end-to-end verification still needs authorized institutional
student and warden test access; service-account access does not replace caller
authentication, and browser session claims are not trusted.
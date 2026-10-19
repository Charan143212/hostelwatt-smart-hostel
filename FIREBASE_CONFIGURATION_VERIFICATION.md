# Firebase server configuration and verification

## Result

Firebase service-account authentication **succeeded**. Real Firebase report
reads, writes, partial PATCH updates, and persisted readback **succeeded**.
One generated temporary report was created under `hardware_reports`, then removed
in a `finally` block using PUT null. A subsequent read confirmed it was absent.
No test report remains from this verification. Existing records were not changed.

### Requested SDK limitation

This application runs on the existing TanStack Start hosted server, not a
standalone Node.js process. Firebase Admin SDK is Node-only and unsupported by
this hosting environment. It was **not installed**. The existing server-only
Firebase REST/Web Crypto service-account implementation was adapted instead.
Moving to an external Node host would be required for the requested Admin SDK.

## Required environment variables

All four were saved through the encrypted secret form:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`

Reads happen inside a server-only request-time function. Escaped `\\n` in PEM keys
are converted to actual newlines. The existing project and database destination
are validated to prevent accidental data relocation or token disclosure.
The old `FIREBASE_SERVICE_ACCOUNT_*` names are no longer read.

## Verification

- `RUN_FIREBASE_INTEGRATION=true RUN_FIREBASE_WRITE_VERIFICATION=true bunx vitest run`:
  **6 test files, 49 tests passed**, including two live Firebase tests.
- Generated ephemeral test-key assertion signature verified cryptographically;
  isolated tests cover newline normalization and each required environment name.
- Automatic type/build verification: latest entry **build OK**, 2026-10-18
  20:21:35 UTC. Earlier type errors in a new test were corrected before this result.
  Manual typechecks and production builds are delegated to the automatic harness;
  no separate manual production build is claimed.
- Existing routing tests emit pre-existing empty-link warnings; they pass.

HTTP endpoint checks against the running application:

| Request | Observed result |
| --- | --- |
| GET /api/health | 200, `{"status":"ok","service":"HostelWatt API"}` |
| GET /api/hardware-issues | 401, institutional credentials required |
| POST /api/hardware-issues with valid input | 401, no unauthorized report stored |
| PATCH /api/hardware-issues/verification_not_created | 401, no unauthorized update |
| GET /api/hardware-issues again | 401 |

**Successful HTTP create/read/update remains unverified** because no authorized
institutional student and warden test credentials were supplied. The real Firebase
service tests establish connectivity/persistence, not a full authenticated API
flow. No login bypass, fabricated account, or credential-record modification was
used. A managed Cloud session cannot authenticate these institutional APIs.

## Exact application/document files changed in this task

Created:

1. `src/server/firebase/config.server.ts`
2. `src/server/firebase/config.test.ts`
3. `src/server/firebase/live-connection.test.ts`
4. `FIREBASE_CONFIGURATION_VERIFICATION.md`

Modified:

1. `src/server/firebase/client.server.ts`
2. `src/server/firebase/rest.server.ts`
3. `src/server/services/firebase.server.ts`
4. `src/server/foundation.test.ts`
5. `src/server/hardware-issues.test.ts`
6. `src/server/README.md`
7. `AGENTS.md`
8. `roadmap.md`
9. `src/routes/index.tsx` — share metadata only
10. `src/routes/student.tsx` — share metadata only
11. `src/routes/admin.tsx` — share metadata only

Private assistant constraint memory was updated; it is not application source.
The secure store was configured separately and contains no committed secret files.

## Preservation and secret safety

- No Firebase secrets, service-account JSON, or private key were added to Git or
  application files. No secret values, tokens, or credential records were logged.
- `.gitignore` is protected by this environment and was not changed. Do not place
  service-account files or private keys in the repository; use the secure store.
- Existing visible UI, student/admin login, dashboards, reporting button, theme,
  frontend Firebase client and telemetry/history behavior were not changed.
  Three content routes received only required share metadata, not UI changes.
- No Firebase structure, existing hostel/room data, credential records, Firebase
  rules, or Cloud data/auth setup was modified. Reports remain in Firebase.
- The reporting button remains disconnected from the report APIs.
- Publish the app before expecting these newly saved secrets in a published app;
  the preview already uses them. The app was not published by this task.
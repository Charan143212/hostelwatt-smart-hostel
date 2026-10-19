# Backend foundation

## Connect hardware reporting

- [x] Connect the existing report dialog to POST using locked student session assignments, guarded submissions and truthful results.
- [x] Add scoped real report listing and status updates to the existing admin dashboard.
- [x] Test submission identity, duplicate prevention, error handling and admin updates; automatic verification is clean. Browser checks confirm both demo dashboards open, student room is read-only, demo submission is disabled, admin re-verification is shown and no runtime errors occur.
- [x] Document changed files and real-persistence evidence below.
- [ ] Verify the complete student submission and administrator update through the live UI (blocked: authorized institutional student and warden test access is unavailable; demo access is intentionally rejected).

### Hardware reporting verification and changed files

All 70 tests passed with live Firebase integration enabled, including authenticated service-account read, temporary report write, PATCH, readback and removal. The final ordinary test run passed 68 tests with the two opt-in live tests skipped. Automatic build/typecheck reports build OK. Component tests cover pending duplicate prevention, failure retention without success, successful admin status mutation and failure preserving the stored status. These do not substitute for a real institutional-authenticated browser flow.

Created: `src/lib/auth/report-access.ts`, `src/lib/auth/report-session.test.ts`, `src/lib/hardware-reports.ts`, `src/lib/hardware-reports.test.ts`, `src/lib/contracts/hardware-issues.ts`, `src/components/HardwareIssueDialog.tsx`, `src/components/AdminHardwareIssues.tsx`, `src/components/hardware-report-flows.test.tsx`.

Modified: `src/lib/auth/session-store.ts`, `src/components/AuthModal.tsx`, `src/routes/admin.tsx`, `src/components/SiteFooter.tsx`, `src/server/types/hardware-issues.ts` (compatibility export of the browser-safe shared contract), `AGENTS.md`, `roadmap.md`. Project memory requirements were updated separately in `mem://constraints/backend-foundation`.

Existing login verification, telemetry/history, navigation, theming and Firebase hostel/room data remain unchanged. Report credentials are held only in memory; persisted sessions must re-verify reporting access after reload. No mock reports were added.

## Firebase environment configuration

- [x] Wire the four requested environment names into the server-only Firebase connection, retaining hosted-compatible REST instead of unsupported Admin SDK.
- [x] Run all tests and inspect automatic verification; document exact changes and preservation confirmations.
- [x] Verify real Firebase authentication, read/write/patch/readback and removal of the single temporary verification report.
- [ ] Verify successful institutional-authenticated HTTP GET/POST/PATCH/GET (blocked until authorized student and warden test access is supplied; endpoints correctly return 401 without it).

## Hardware issue API

- [x] Add validated POST/GET/PATCH hardware report APIs with server-only Firebase persistence and protected access.
- [x] Test validation, persistence behavior, filters, updates and configuration failures; verify live error responses.
- [x] Document exact file changes and automatic verification results; preserve existing frontend.
- [x] Verify real Firebase create/read/update flow and temporary report cleanup through the server Firebase service.

- [x] Add isolated TypeScript server structure and GET /api/health.
- [x] Add read-only, credential-safe Firebase connectivity service and tests.
- [x] Verify health endpoint and existing tests; report automatic build/typecheck status and unchanged frontend files.
- [x] Verify authenticated Firebase service-account access.
# Backend foundation verification

## Outcome

Implemented a TypeScript backend foundation using the existing TanStack Start
server, not a standalone Node.js process. Firebase remains the current data store.

Live check: `GET http://localhost:8080/api/health` returned HTTP 200 and exactly:

```json
{"status":"ok","service":"HostelWatt API"}
```

## Verification

- Ran `bunx vitest run`: all 3 test files and all 12 tests passed, including the
  existing student verification and routing tests.
- Automatic build verification reported `build OK` after the implementation.
  No manual production build or typecheck was run, because this environment
  delegates these checks to its automatic verification harness. No separate
  typecheck result was available; independent typecheck verification is not claimed.
- Existing routing tests emit pre-existing empty-link warnings; they still pass.
- Authenticated server Firebase connectivity is **not verified**: neither required
  service-account secret is configured. Missing-credential behavior, safe failure
  behavior and read-only probe behavior are covered by tests. Mocked access does
  not establish that the real database accepts a service account.

## Created files

- `src/routes/api/health.ts`
- `src/server/types/status.ts`
- `src/server/routes/health.server.ts`
- `src/server/firebase/client.server.ts`
- `src/server/services/firebase.server.ts`
- `src/server/foundation.test.ts`
- `src/server/README.md`
- `roadmap.md`
- `BACKEND_IMPLEMENTATION.md`

## Modified files

- `AGENTS.md`: backend boundary and runtime architecture rules.
- `src/routeTree.gen.ts`: regenerated automatically to register `/api/health`,
  not edited manually.

Project memory was also created for the requested preservation and credential
constraints; it is private assistant metadata, not application source.

## Unchanged

Student login and admin login source remain unchanged. No new account flow or
authentication behavior was introduced. A live login was not exercised; source
preservation and the existing student tests are the verification evidence.

The existing `src/lib/firebase.ts` frontend integration, Firebase RTDB structure,
telemetry/history, dashboards, content routes, theme, UI, hardware reporting
button, and existing Cloud scaffold remain untouched. Only a new API route was
added; existing page paths were not changed. No database writes or migrations
were performed.

## Remaining setup

To enable the internal Firebase check, configure secure server secrets
`FIREBASE_SERVICE_ACCOUNT_EMAIL` and `FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` for
an appropriately permissioned service account in the existing Firebase project.
Do not paste private credentials into chat or commit service-account JSON.
Credentials would be entered through the secure secret form after agreeing to
that setup. The internal diagnostic is deliberately not a browser-callable API.
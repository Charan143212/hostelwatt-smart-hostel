<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep institutional access records and verification client-side while the experience is explicitly a simulation, because no persistent authentication service is connected.
- Mount application-wide navigation and footer content in the root shell so every route shares the same frame.
- Light/dark theming lives only in CSS variables (:root = light, .dark = dark) toggled by a class on <html>; components use semantic tokens so one layout serves both themes.
- Ordinary student verification uses Firebase; hardcoded student records are exposed only through the explicitly named demo verifier, preventing legacy callers from validating real access against demo allocations.
- Backend foundation lives in server-only modules under `src/server/`, dynamically imported inside TanStack server route handlers; this keeps private operations out of the browser while preserving the existing frontend.
- Firebase server access uses path-restricted REST operations and Web Crypto OAuth with credentials normalized in shared request-time server-only configuration; destination validation prevents token disclosure or accidental data relocation without unsupported Node-only Admin SDK dependencies.
- Hardware report API authorization verifies existing institutional credential records independently of browser sessions, with students scoped to their assigned room and wardens to their assigned hostel; this prevents impersonation without altering frontend login.
- Hardware report writes are restricted to their own Firebase collection and updates use partial PATCH operations followed by a readback; this preserves existing hostel data and concurrent untouched report fields.
- Hardware reporting uses one browser API client and session-keyed query caches; student payload identity comes only from session fields, while the server independently verifies assignment and role.
- Shared hardware report schemas live under `src/lib/contracts`, with server compatibility exports; browser code must never import from `src/server` even for schemas because the server import guard excludes that tree.
- Live login supplies report API Basic authorization held only in volatile memory and cleared on logout or demo login; persisted UI sessions require re-verification after reload, preventing credentials from entering browser storage without changing existing login verification or adding a new authentication system.

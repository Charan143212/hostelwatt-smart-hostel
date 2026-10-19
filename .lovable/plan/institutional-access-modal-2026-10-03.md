# Institutional Access Modal

## Build
- Replace the current demo sign-in/sign-up interface with a centered glass access modal and two explicit tabs: student and administrator.
- Add icon-prefixed fields, password visibility controls, inline validation, secure-role messaging, and the requested teal glow treatment.
- Simulate student room assignment checks and administrator credential checks with clear success and failure notifications.
- On successful student verification, close the modal and open the matching room dashboard; on administrator verification, open the full administrator dashboard.
- Show the active verified identity in the site header for the current session.

## Verification
- Test student success and assignment failure, administrator success and failure, tab switching, password visibility, and both redirects.
- Confirm the modal remains readable and usable on mobile and desktop, then check the preview build and runtime logs.

## Technical details
- Use Zod client-side schemas with strict length and format limits.
- Keep verification simulated in front-end records; no real accounts or persistent authentication are added.
- Pass the verified room through typed route search state so the student dashboard displays that room’s telemetry.

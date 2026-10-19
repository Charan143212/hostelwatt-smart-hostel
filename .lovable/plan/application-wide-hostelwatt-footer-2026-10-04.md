# Application-wide HostelWatt footer

## What will be built
- Add a shared footer below every page, with the existing HostelWatt logo, mission text, live system status, navigation, support details, and energy-impact statistics.
- Use a four-column desktop layout that collapses into a clean single column on phones.
- Add a compact hardware-issue report dialog with room number, issue type, and description fields; successful submission will be simulated with a confirmation message because the app has no connected persistent service.
- Add the requested copyright line and legal links in a divided bottom bar.

## Technical details
- Mount the footer once in the application shell so every current and future page receives it.
- Use existing semantic color tokens, Button/Dialog/Input components, and Lucide icons to match the dark glass-and-teal visual system.
- Keep the overall shell at least viewport height so short pages place the footer at the bottom.
- Legal destinations will be non-navigating labels because dedicated policy pages were not requested.
- Verify compilation and inspect the footer and report dialog at desktop and mobile sizes.

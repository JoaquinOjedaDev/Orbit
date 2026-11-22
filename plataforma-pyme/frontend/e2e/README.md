# E1-D2 — Browser E2E

Insulated tests in desktop and mobile Chromium. Use a clean browser context by test; do not read or overwrite data from `localStorage` / IndexedDB de tu equipo.

Requirements: Node.js 22 or higher, npm, Internet connection to install Playwright/Chromium the first time.

From `plataforma-pyme/frontend`:

```powershell
npm.cmd ci
cd e2e
npm.cmd install
npx.cmd playwright install chromium
npm.cmd test
```

The Vite configuration automatically starts if it is not yet up. To run desktop only: `npm.cmd test -- --project=desktop-chromium`. For mobile: `npm.cmd test -- --project=mobile-chromium`.

Tests test navigation, external URLs, placeholders, drawer/focus/ESC, no horizontal overflow, catalog isolation, QR creation, persistence, cancellation and simulated approval without duplicate sales. **They don't replace** QA box/stock with physical products and simulate backend security.

The Folder `e2e/` has its separate dependencies to avoid altering the frontend main package or its lockfile.

# E2-7 · T11-D — QA desktop/mobile, keyboard and REAL/DEMO separation

**Date:** 11/11/2026. **Rama:** `feature/e2-7-t11-qa-integral-hardening`. **PR:** #45 (DRAFT).

## Objective and scope

Expand the browser coverage of the already integrated functional prototype, without starting redesign: REAL navigation from keyboard, business routes and POS on desktop (1440×900) and mobile viewport (390×844), form with unchangeable unit price, recovery after F5, absence of commercial POST without confirmation and Real→DEMO→REAL navigation without reusing a session.

**Test file:** `plataforma-pyme/frontend/e2e/real/responsive-keyboard.spec.ts`. Commits funcionales `d102b966cca7184f4e7f793a89c74c6a3b5aa758` y `ab23c6c3f4e6b257bb45a316c4eae6a593689a59`.

**Ambient:** `PYME_DISPOSABLE_QA=1`, FastAPI `127.0.0.1:18001`, PostgreSQL 16 disposable `pyme_t085_ephemeral`, accounts/enterprises/headquarters/exclusive items QA. No contact with `TEST Empresa A`. Runner enables REAL sales only in its isolated instance; T11-D scenarios do not send POST sales.

## Execution matrix

| Case E2E REAL | Specific verification | Outcome |
|---|---|---|
| Desk 1440×900 | Tab from email to password, Enter for login, focus/Enter on company button and POS, headquarters selection, pre-loaded unit price disabled, total for 2 services, review without POST, F5 and login again | **PASS** |
| Mobile 390×844 | Same route with keyboard navigation, cart and price; document without horizontal overflow at page level in POS view (scrollWidth ≤ 391 px); F5 without automatic sale | **PASS** |
| REAL Separation→DEMO→REAL | Real session validated; entry via DEMO link; return to REAL URL requires new login; no POST sales, purchases or inventory | **PASS** |
| Existing regression DEMO | Suite Playwright desktop/mobile independiente del modo REAL | **6 PASS** |

Tests use real routes and components, not substitute for POS business responses with mocks.

## Evidence of IC

- **Functional committee evaluated:** `ab23c6c3f4e6b257bb45a316c4eae6a593689a59`.
- Full-stack #42992157141: **SUCCESS**, `892 passed` Pytest, `31 passed` Playwright REAL y `6 passed` DEMO. The 3 T11-D scenarios approved and the additional mobile width assertion was included.
- Frontend #42992157128: **SUCCESS**.
- **Warnings:** 6 `UnsupportedFieldAttributeWarning` Pydantic in the backend execution. They did not break the test; the number of warnings is variable between previous run of attendance. They will be investigated and recorded with evidence in T11-E.

## Explicit limits and T11-D output

- **Not comprehensive WCAG audit** nor does it guarantee screen reader, contrast, labels or tabulation of all screens. It only certifies keyboard interactions and instrumented concrete paths.
- **Not all mobile resolutions certified**: a viewport 390×844 and desktop 1440×900 were checked. The horizontal overflow control applies to the POS on mobile within the case, not to each table or screen.
- The suite does not compare pixel by pixel or redesign the style of modules; this aesthetic work is deferred according to plan.
- The tests complement T11-A/B/C and the previously existing DEMO suite; they do not justify stating that all REAL features are approved in mobile mode.

**Opinion:** el **functional block T11-D defined by this matrix is APPROVED** and allows to continue to **T11-E**: hardening of proven defects, warnings, final regression and closing minutes. The overall acceptance of T11 remains pending. Do not merge PR #45 or modify `main` without express approval.

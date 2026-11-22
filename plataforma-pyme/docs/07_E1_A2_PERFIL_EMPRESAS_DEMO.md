# E1-A2.1 — Personal and high profile DEMO companies

**Date:** 2026-11-06.
**Status:** Code published in GitHub main; build, lint and manual tests E1-A2 pending to run/register for the computer.
**Source:** E0-B and backlog E0-C (E1-A2); ADR-001, ADR-002 and ADR-007 still **PROPOSALS**.
**Scope:** functional increase of demonstration, does not authenticate users and does not create companies in backend.

## What was implemented

1. **Single personal profile** In /profile: visible name and optional DEMO mail, editable; profile does not depend on the selected business. No password, login or authorization.
2. **Create company** in /company/new: name, type Products / Services / Mixed, optional item and optional description. No stock obligation, box, local, recipes or fair.
3. **Consistent high**: the creation records a company and an active DEMO membership with PORTUGUESE_ADMINISTRATIVE role for the demonstration user; founder and initial manager agree but are different fields. There is no transfer of ownership.
4. **Integrated selector and dashboard**: Newly created companies appear in /start as well as the selector of the top bar and you can tour your /b/:businessId/start.
5. **Start of business sheet** in /b/:businessId/company: name, activity, description and DEMO title information. Read only; future edition E1-B.
6. **Gateway example typed**: demoGateway.saveProfile and demoGateway.createBusiness return Promise and operate on a single local state source observable usingSyncExternalStore.
7. **Local only persistence**: Creation data and profile are saved in localStorage under the versioned key assistant-pyme.e1a2.demo.v1. The 3 initial businesses WALOS, Trade Example and Services Example are rebuilt as fixes, do not duplicate each save. Local value, no security or backup.
8. **Context by company**: Business and membership indexed by businessId. The route does not validate real identity; the DEMO view only finds businesses with active DEMO membership in the local snapshot.

## Files

- frontend/src/data/demo/demoStore.ts — types, fixes, unique snapshots, versioned upload, typed commands and subscription.
- frontend/src/features/profile/ProfilePage.tsx — formulario personal.
- frontend/src/features/business/BusinessPages.tsx — creation and business sheet.
- frontend/src/App.tsx — functional paths and DEMO snapshot reading.
- frontend/src/app/shell/TopBar.tsx — dynamic selector and avatar.
- frontend/src/app/navigation.ts — no parallel list of companies.
- frontend/src/features/dashboard/Dashboards.tsx — dynamic business listing and login Create active.
- frontend/src/App.css — responsive styles of forms.
- frontend/README.md — instructions.

## Acceptance tests (pending, no result claimed)

First, inside platform-pyme/frontend:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run dev
~~~

| ID | Procedure | Criterion |
|---|---|---|
| E1A2-BUILD | build y lint | No errors or warnings |
| E1A2-PER-01 | Go to My Profile, Change Name DEMO and Save | Avatar and name reflect change; refresh maintains value |
| E1A2-PER-02 | Change WALOS∫Services and return to My profile | Profile remains unique and shared |
| E1A2-PER-03 | Invalid mail, 1 character name | Form rejects saved, gives feedback |
| E1A2-ONB-01 | Create company type SERVICES without item/local/stock | Successful creation; leads to Business Start |
| E1A2-ONB-02 | Back to /start and open selector | Company appears in both places |
| E1A2-ONB-03 | Reload page and restart Vite | Company created is conserved in same browser |
| E1A2-ONB-04 | Create a company of the same type | No warehouse request; correct type display on tab |
| E1A2-TEN-01 | Change company A/B, visit tab, return | Names/identifiers correspond to the businessId active |
| E1A2-TEN-02 | Open /b/id-non-existent/start | ‘Company not available’ means no attributes of other companies |
| E1A2-NAV-01 | Hamburger, back, change of company | Navigation and modal still work |
| E1A2-RESP-01 | Screen 390 px | Useable forms without horizontal displacement |

## Limitations and upcoming tasks

- DEMO companies/identities/roles are not real users, authorizations or tenants; anyone with access to the local browser can alter local data.
- There are no real sessions, sync between computers or tabs, invitations, operating drafts, transfers, APIs, PostgreSQL and Market Payment.
- Local persistence may fail by quota, private mode or configuration: the interface will remain in memory but is not securely saved permanently; improvement requirement: indicate storage failure to the user if serious use is made.
- Next cuts: Vitest suite + smoke E2E; React Router; isolation rules and draft scope; then integration of M1/M2 and E1-C modules.Do not invent business functions from the form.
- Before closing E1-A2 the equipment must review/approve or modify ADR-001/002. The rule used here is provisional and safe for demo, does not imply approval of the ADR.

**They didn't touch each other.** TP sister projects were not copied or copied from real data or global scripts of historical HTML.

# E1-B4 — DEMO work equipment and nominative invitations

**Date:** 2026-11-06.
**Status:** Code published in GitHub main; build, lint, tests and browser PENDENT to run locally.
**Source:** E0-A Z002/Z014; E0-C E1-B1-02; ADR-001/002/003.

## Scope implemented

- Route /b/:businessId/equipment and quick access "Work equipment" available.
- Listed: the overall profile of the initial holder, with the job function of this company; fictitious collaborators resulting from simulated responses.
- Nominative invitation: proof mail, role ENTRY or WORKER. No PROPERTY offered nor transfer of title.
- PENDENT, CANCELATED, REJECTED AND ACCEPTED STATES; EXPIRED is calculated on the interface without creating memberships. Proposed 7-day force.
- Pending invitation fee DOES NOT add member or access. Simulate response requires an independent step, with explicit acceptance/rejection.
- Accept updates the invitation and creates DEMO member in a single local status notification. Repeat acceptance does not duplicate members.
- Cancel and refuse do not create members. The initial holder is not removed or degraded.
- The commands include businessId and reject invitations IDs from other companies. Same mail in A and B does not share role.
- Link/QR to request incorporation continues "Next", without inventing a QR that grants access.

## Persistence and safety

The same wizard-pyme.e1a2.demo.v1 and version 1 key is retained. Optional arrays are added teamInvitations and teamMembers. Previous data profile, createdBusinesses, fixtureEdits, memberJobs, locations and mapUrl remain in the same object; their reading is compatible.

The valid load format IDs, mails, roles, states, dates and business membership. A restored member must be associated with a coherent ACCEPTED invitation.

There is no recipient authentication, actual email sending, acceptance token, authorization, persistent audit or concurring. The "Simulate Acceptance" button represents the recipient's response only within the local DEMO; it is not a real action of the holder to accept by another person. Productive implementation must incorporate single-use tokens, actor permissions, verified identity acceptance and backend transactions.

## Files

- frontend/src/data/demo/teamPolicy.ts — pure role policy/email/expiration.
- frontend/src/data/demo/demoStore.ts — invitations and members in snapshot and typed commands.
- frontend/src/features/team/TeamPage.tsx — panel, form and simulated responses.
- frontend/src/App.tsx — ruta scoped por businessId.
- frontend/src/features/dashboard/Dashboards.tsx — Shortcut available.
- frontend/src/App.css — adaptable design.
- frontend/tests/team-policy.test.mjs y script npm test:team — pruebas unitarias.

## Commands from platform-pyme/frontend

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:team
npm.cmd run test:maps
npm.cmd run dev
~~~

If Vite is already active, do not start it again. The compilation and new tests have NOT been executed on the computer computer.

## Acceptance matrix

| ID | Action | Expected |
|---|---|---|
| EQ-01 | Enter Team in WALOS | Initial holder present; no invented employee |
| EQ-02 | Invite person@example.invalid with role Worker | PENDENT, number of members does not change |
| EQ-03 | Invite the same mail with capital letters in the same company | Rejects duplicate |
| EQ-04 | Same mail in another company | Role independence/invitations |
| EQ-05 | Simulate acceptance | Only now creates DEMO member |
| EQ-06 | Update F5 or repeat acceptance | No duplicates; invitation and member preserved |
| EQ-07 | Create another invitation and cancel | CANCELADA, no member |
| EQ-08 | Simulate rejection | Rejected, no member |
| EQ-09 | Review Role Selector | Only Maintainer/Worker; not Owner |
| EQ-10 | Edit job title | Administrative responsibility does not change |
| EQ-11 | Test old profile, companies, locations and maps | Previous persistence intact |
| EQ-12 | 390 px screen, keyboard and menu | Interfaz legible, accesible |
| EQ-13 | Build, lint, test:team, test:maps | No mistakes |

## Next decisions

ADR-003 must be approved or modified by the team before generating actual invitations. Complete guest account flow, effective expiration, revocation and authorization by location in backend, with audit. For the next functional cut you can advance with Catalog or Accounts and means of collection, maintaining reach TP3.

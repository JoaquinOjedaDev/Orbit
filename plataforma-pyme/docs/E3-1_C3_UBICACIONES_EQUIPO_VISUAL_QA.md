# E3-1C3 — Locations and Equipment: REAL visual redesign and QA

**Dependent base:** PR #50 E3-1C2, feature branch/e3-1c2-data-company-visual; main remains unchanged.
**Own branch:** feature/e3-1c3-locations-equipment-visual.
**Scope:** platform-pyme/frontend/ (REAL screens), an exclusive CSS sheet and E2E tests with ephemeral PostgreSQL.

## Scope

### Locations
- Heading consisting of "My Profile", "My Companies" and "Company Data".
- Abstract obtained from the REAL list: total, active, paused and main (without invented KPI).
- Headquarters tabs with name, type, status, main, address, SELL/STORE and Map link only if it exists.
- Search by name/type/address and filter by status **solo en memoria local**, sin nuevos endpoints ni escribir al servidor.
- Context form to create/edit: retain validations, field names, capabilities and cancellation; controls to activate/pause, make principal and assign workers maintain existing operations.

### Equipment
- REAL Directory of Members with Initials Avatar **not persisted**, role, status and function when available.
- Summary of active/inactive members, search and filter **only for read-permitted roles**.
- Explanatory card for those who do not have a reading permit, without listing or counting members.
- Role and activation/disablement selectors only for canManageTeam, without allowing to change your own account or holder.
- Invitation with token shown once; no automatic email submission. No renewal or implied forwarding.

## Invitation to change internal roles

Both controls have different purposes and their options **are not identical by design**even if their visual labels are consistent:

- **Invite a new collaborator:** API accepts only `TRABAJADOR` o `ENCARGADO`. This operation generates a single-use code; the recipient must accept it to incorporate its membership. The owner or an administrator with invitation permission can initiate it.
- **Changing the role of an existing member:** la API admite `TRABAJADOR`, `ENCARGADO` o `ADMINISTRADOR`. The operation is exclusively from `TITULAR_ADMINISTRATIVO` by changing membership, not a direct invitation path as Administrator.
- **Administrative holder:** is not listed as a destination in any of the controls. None allows transfer of title.
- **UX:** the directory explains that editing is an internal change (ascent or reassignment), and the invitation form explains why Administrator is not available. Both selectors show role names with the same capitalization. The role change requests explicit confirmation.

API contracts, role model, backend authorization and historical data are not modified.

## Visual navigation of Locations: independent views (UX 12/11 revision)

**Manual QA observation:** forms and assignments appeared under cards, sometimes simultaneously, without a clear answer when pressing a button.

**Decision:** within the same REAL Locations route, render **one view at a time**:

- **Listing**: summary, search, filters, cards and actions; no forms deployed at the end.
- **New location / Edit location**: exclusive screen, header with headquarters name (if any) and **‘Back to locations’** at the top; prefilled form when editing.
- **Headquarters allocations**: exclusive screen with title and assignable staff; return using the same top button.
- Al presionar los botones se aplica feedback visual breve (`:hover`, `:active`, `:focus-visible`) and, when entering a dedicated view, the focus is moved to the Back button to improve keyboard navigation.
- **Cancelar / Volver** discards only the unwritten draft; **Save** retains the previous API operation and returns to the list when confirmed. Uncertain results continue to require explicit re-check. Save/error alerts are displayed above content, not at the end of the list.
- The list retains searches/filters while changing views within the same company; no form crosses tenant. No routes, new tabs or actual popups are created; it is an internal navigation with independent screen appearance.
- The pause/reactivate and main buttons are maintained on the cards, with their previous confirmations; these actions do not open editors.

**Extended tests:** access to edit/assignments, concealment of the list when entering, focus on Back, discard without PATCH, save real and persistence, return to the list and respond to 390 px (exclusively in disposable DB).

## Technical invariants

1. **No changes to backend, migrations, APIs, realOperationsGateway, contracts, roles or permission rules.**
2. The busy states, uncertainties, errors and confirmations are preserved: uncertain operations are not automatically forwarded.
3. All list status is mounted in the active company; the change of tenant goes back to sight. No demoStore or tokens persisted.
4. CSS of e3-ops-* isolated from DEMO; design adaptable to 390 px.
5. Computer data is requested from the server only if the company allows canReadTeam. Backend remains the authority for each request.

## Testing and review

**Existing mandatory tests:** npm.cmd run build, npm.cmd run lint, npm.cmd run test:auth, npm.cmd run test:operations-real, suite E2E REAL completa y DEMO, y backend con PostgreSQL descartable en CI.

**E2E C3:** frontend/e2e/real/locations-team-visual.spec.ts: creates two locations, pause one, incorporates a worker by token and confirms visualization, filters, cancellation without writing, absence of mobile overflow 390 px and privacy of the team for Worker. Requires SME_DISPOSSABLE_QA=1.

**QA revision manual (without writing on important data):**
1. Check that the header, cards and statistics match your REAL company; search/filter without writing requests.
2. Open creation and cancel; open edit and cancel; verify absence of changes.
3. Test assignments in a test company with active members, not productive companies.
4. Review Team as a holder/admin and worker: the worker should not see the private directory or invitation actions.
5. Verify 390 px, 768 px and desktop, side menu and keyboard focus.

**Pending unit:** PR #50 does not merge automatically. First check/accept C2 and C3, resolve IC checks and just then request express authorization for the merges **en orden**. A stacked PR against C2 avoids introducing C2 into main without permission.

## Exclusions

No geolocation, image uploading, email invitations, server search, permission policy, high fictions or box/QR features are added.

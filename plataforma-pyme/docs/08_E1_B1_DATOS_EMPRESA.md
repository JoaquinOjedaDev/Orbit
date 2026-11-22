# E1-B1 — Company data: first Z001 integration

**Date:** 2026-11-06.
**Status:** Posted in GitHub main. Compilation, lint and browser tours pending local execution by the team.

## Design references

- Buton_Edit_Profil_Company.html (Z001): general information, visual identity, contextual editing, optional CUIT, slogan, biography, documents and contacts.
- Menu_Principal(1).html (Z003): Business panel, identity, user profile and menu.
- Current and previous HTML React screenshots provided by the team.

Visual patterns are reconstructed in React. Global scripts, innerHTML, fixed WALOS data are NOT copied as product rule, example files, invented metrics or authorization simulations.

## Implemented

1. Editable view on business path /b/:businessId/company, with business hero.
2. Cards with context editing, Cancel and Save for business name, category, slogan, presentation/biography and optional test CUIT.
3. Unique command demoGateway.updateBusinessDetails(businessId, patch), which acts exclusively on the selected DEMO company and keeps up to date the top selector and Starter.
4. Companies created continue to persist as before under createdBusinesses.
5. To edit the three fixture businesses, an optional fixtureEdits object is saved in the same versioned wizard-pyme.e1a2.demo.v1 key; avoid deleting the profile and created companies that are already in that storage.
6. The default empty slogan and taxId fields are incorporated in old data (compatible with E1-A2).
7. Field erasers are dismantled when changing businessId; they are not transferred between companies.
8. Validations: name between 2 and 80 characters, heading up to 120, description up to 350, slogan up to 120, empty fictional CUIT or eleven digit format (with optional scripts).The format does not verify the fiscal identity.
9. Documents and means of contact appear as Coming Soon, without promising loads, networks, storage quotas or authorizations.
10. Logo loading, change scheduling, roles, pause and editing of deferred contacts to later increments with defined domain.

## Updated code

- frontend/src/data/demo/demoStore.ts
- frontend/src/features/businesses/BusinessDetailsPage.tsx
- frontend/src/features/businesses/BusinessPages.tsx
- frontend/src/App.tsx
- frontend/src/App.css

## Verify in VS Code (not yet executed in this delivery)

From platform-pyme/frontend:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run dev
~~~

| ID | Action | Expected |
|---|---|---|
| E1B-EDIT-01 | Change created DEMO company name | Hero, Selector and Start Updated |
| E1B-EDIT-02 | Save slogan and biography, F5 | They persist in the same browser |
| E1B-EDIT-03 | Edit Fixture Header WALOS, F5 | Change is preserved |
| E1B-EDIT-04 | Edit A, switch to B and return | Data between A and B are not mixed |
| E1B-EDIT-05 | Save empty name or 1 letter | Rejection, previous data intact |
| E1B-EDIT-06 | Fictificated format CUIT | Clear error, unsaved |
| E1B-EDIT-07 | Change Field and Cancel | Do not alter the data |
| E1B-EDIT-08 | Change your company with open edition | Do not transfer draft |
| E1B-EDIT-09 | Documents/Contacts | Coming soon, no misleading actions |
| E1B-EDIT-10 | Reduce width to 390 px | Readable fields and operating menu |
| E1B-MIG-01 | DEMO profile and company existing before change | Preserved data |

**Nota:** storage only DEMO, is not backup, synchronization, authentication or actual authorization. Avoid real personal/fiscal data.

## Pending

- Run build, lint and tests; then record results.
- Integrate automated tests and React Router, as proposed by ADR-007.
- Later enrich the global profile (initial, position, optional contact), based on the capture of the original modal, without doubling profile per company.
- Model documents, contacts visibility and scheduled changes before enabling them.
- Integrate Locations and Work Equipment according to E1-B, maintaining TP3 requirements.

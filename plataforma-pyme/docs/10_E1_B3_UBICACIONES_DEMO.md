# E1-B3 — DEMO locations per company

**Date:** 2026-11-06. **Status:** code published in main; build, lint and visual tests LOCAL PENDENT.
**Design base:** E0-A Z004 (Locations.html) and E0-B matrix. No global scripts or actual data were copied from the original HTML.

## Scope implemented

- Enabled `/b/:businessId/ubicaciones` with list, high/edit form, button to designate main and pause/reactivation with context confirmation.
- Types: Local, Fair, Deposit, Office and Other; Optional address/reference. Ability to sell and storage capacity are independent booleans.
- A service company may have **zero locations**. Create a company **no** generates deposit, cashier or inventory.
- A location belongs to `businessId`, and DEMO commands check membership before editing, pause or make main.
- At most there is a main location **active** If the main one pauses, it loses its main state and the company can be left without principal; when reactivated it is not automatically restored.
- No location is removed, its status is changed. The system still has no stock, box or transactional references; pause **no** executes validations of pending operations and should not be considered as production-ready.
- Data is saved in `locations` inside pre-existing storage `asistente-pyme.e1a2.demo.v1` (version 1), manteniendo profile, createdBusinesses, fixtureEdits y memberJobs intactos.
- Local storage validates formatting, business ownership and uniqueness of main location by company. It is not real security or backup.
- Forms are dismantled when changing business with `key={business.id}`; drafts are not transmitted between companies.

## Files

- `frontend/src/data/demo/demoStore.ts` — Location, input tipado, indexado por ID, lectura y guardado compatibles, comandos createLocation/updateLocation/setPrimaryLocation/setLocationStatus.
- `frontend/src/features/locations/LocationsPage.tsx` — creation, editing, listing, main and pause/reactivation.
- `frontend/src/App.tsx` — connection to the route `ubicaciones` per company.
- `frontend/src/App.css` — cards and form responsible.

## Outstanding validations (not reported)

From Folder `plataforma-pyme/frontend`:

```powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run dev
```

| Test | Procedure | Expected outcome |
|---|---|---|
| UBI-01 | Open newly created Services company locations | Empty list, no premises or fictitious deposit |
| UBI-02 | Create local location with selling=Yes, store=No | An active location appears, no generated inventory |
| UBI-03 | Create Deposit with Sell=No, Store=Yes | Both capacities are independent |
| UBI-04 | Choose another main location | The previous one is no longer the main one |
| UBI-05 | Pause main location | It is paused, without main; offers to reactivate |
| UBI-06 | Reactivate location | Active, does not become principal alone |
| UBI-07 | Edit A; switch to B; return | A retains data; B is not affected or inherited draft |
| UBI-08 | Save changes and press F5 | The records of each company persist |
| UBI-09 | Refresh with pre-existing profile, companies and job function | Previous data retained |
| UBI-10 | Try empty or invalid name | Error/validation; does not alter status |
| UBI-11 | Reduce to 390px mobile screen | Form and cards readable |
| UBI-12 | `npm.cmd run build` y `npm.cmd run lint` | No errors or warnings |

## What Is NOT Implementing

There is no API, effective permissions, geolocation, inventory, box, partner locations or pause lock with pending operations. Integration with TP3, location roles, stock leadger and sales comes in subsequent increments. Before using break with actual operations, add stock validations and server box, do not rely on visual controls.

## Update E2-2 A.1 — CASE IN DEMO (08/11/2026)

Added option **CASA — Home or private home** the existing location selector, preserving `LOCAL`, `FERIA`, `DEPOSITO`, `OFICINA` y `OTRO`The guy `LocationKind`, labels and both validations (input and local storage recovery) accept CASA. `canSell` y `canStore` remain independent and all previous commands and data are maintained. The screen generates its options from `locationKindLabels`so it doesn't require another visual implementation. **No geolocation, publication or automatic verification of domicile** and there is no synchronization with FastAPI. CASA change ICs approved: backend 217 tests, frontend build/lint/E2E 2/2. For manual check: create CASA on selector, save, reload and verify persistence; also verify which locations of previous types remain visible.

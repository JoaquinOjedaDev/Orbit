# E2-7 T08-3 — Real Transfer Integration Plan

**Updated status after T08-5:** REAL transfer circuit **Functionally accepted** with manual evidence of balances, leadger and traceability; QA permissions, recovery and idempower completed by PostgreSQL/Playwright isolated. **No** The adverse rejection scenario 403 was performed manually with Miguel; DEMO was checked manually on T08-5 and automatically on desktop/mobile. This record retains the partial observations of each round as a history. `feature/e2-7-t08-inventario-real`, PR #41 in draft, not merged.

## 1. Checked starting point

T08-1 (stock consultation/ledger) and T08-2 (history and traceability) have primary functional tests approved by the user; T08-2 reports **6/6** manual cases. IC T08-2 validated: 25/25 inventory, 190/190 frontend, build and lint correct; existing E2E Chromium. This does not equal the comprehensive QA T08-5/T11.

Backend **already implemented** low `app/modules/purchases/`:
- `transfer_router.py`
- `transfer_schemas.py`
- `transfer_service.py`

**Do not duplicate or reimplement business rules on frontend.**

## 2. Existing actual contract

**POST** `/api/v1/businesses/{business_id}/inventory/transfers`

Headers:
- `Authorization: Bearer <token opaco>`
- `Idempotency-Key: <UUID v4>` by unique intention, stable before replay.

Strict body:

```json
{
  "catalog_item_id": "UUID DEL ARTICULO REAL",
  "source_location_id": "UUID ORIGEN",
  "destination_location_id": "UUID DESTINO",
  "quantity_milli": 1000,
  "reason": "Traslado entre sedes de prueba"
}
```

Contract restrictions:
- Item `BIEN` asset of the selected company; non-transferable service.
- Different, active and storageable locations; both ends within the same tenant.
- `quantity_milli` whole `1..999999999`; discrete units (`UNIDAD`, `CAJA`, `PAQUETE`) multiples of 1000; other units allow thousandths compatible.
- `reason`: between 3 and 500 characters after normalizing spaces.
- El backend verifica **STORE permission in both offices** and avoid negative balance.
- Un solo commit registra **exit** at source, **entry** in destination, historical operation and updated balances.
- `201`: creation; `200`: replay con **same key, actor and body** (without doubling).
- `401` invalid session, `403` no permit at source or destination; `404` resource outside tenant/not available, `409` lack of balance, incompatible headquarters, suspended company or conflict of willpower, `422` incompatible body/quantity.
- **GET** `/api/v1/businesses/{business_id}/inventory/transfers/{transfer_id}` allows to recover an operation **if transfer_id is known**; there is no endpoint here by `Idempotency-Key`.

## 3. Proposed work order

1. **Gateway TypeScript**: Strict DTOs by tenant, UUIDs, movements and sign; POST and GET; HTTP error distinction and transport. No automatic retry.
2. **Exact conversion**: text `1` discrete unit → `1000` thousandths; reject discrete fractions of goods. Do not use ambiguous floating multiplications for monetary/unit quantities.
3. **Transfer dialogue** from REAL Inventory: select article, home address, different destination, quantity and motif. Show balance **consulted** of origin before confirming, but **not assume it as authorization or guarantee against competition**.
4. **Permissions**: guidance visual eligibility according to role/location/known assignment; FastAPI always authorizes, especially STORE in both locations. Do not invent privileges.
5. **Express confirmation**: display `X unidades de artículo desde Origen hasta Destino`. One single POST after acceptance. Block double clicks.
6. **Durable identity of intention**: design secure registration by `actor_id + business_id` Keeping **canonical body and Idempotency-Key itself** after F5, without storing token. IndexedDB consent and risk policy following T06/T07. If storage fails, avoid mutation that cannot be recovered.
7. **Uncertain result**: when connection/timeout fails after POST is sent, **not create any other intention or key**. If obtained `transfer_id`, offer detailed GET. If not obtained, revalidate with the user and allow **explicit forwarding with identical key/body** (backend will respond 200 to replay) No GET for non-existent key, no arbitrary deletion of intent or automatic retry.
8. **Confirmation and subsequent reading**: show output/entry summary and the two movements with identifiers; refresh both balances and history with API. Do not calculate final projection as a true source.
9. **Regression**: preservar T08-1/2, T07 y DEMO, sin nuevos endpoints backend ni scripts globales.

## 4. Mandatory automated testing

- DTOs de POST/GET completos, URL relativa, Bearer, header UUID v4.
- `201` new and `200` replay of the same body; a single logical transfer.
- Local rejection: source=destination, quantity/negative, maximum excess, discrete unit fraction, `SERVICIO`invalid motive.
- The two movements must correspond to the same `inventory_operation_id`, uno `TRASLADO_SALIDA` negative at source and other `TRASLADO_ENTRADA` positive at destination; error closed if not.
- `401/403/404/409/422` with useful messages, without DEMO failback.
- Network/timeout interruption: unknown result, not automatic POST; F5 recovers original body/key in the correct user scope.
- Change of company or user cancels previous reading and does not expose cross data.
- Compilation, lint, existing frontend tests and non-regression Chromium CI.

## 5. Suggested manual QA (use fictitious data and small amount)

**Precondition:** in TEST Company A, Product A TEST has 11 units in `Sede A TEST` and no balance recorded in `Sede A TEST 2`, **only if there were no subsequent movements**. Check status immediately before exercise.

1. With the owner account, make transfer of **1 UNITY** Product A TEST from Headquarters A TEST to Headquarters A TEST 2, explanatory reason and confirmation.
2. Check from the source server **10** and destination to **1**, if the origin was 11. History must record **-1** y **+1** with the same operation.
3. Check the details by ID and confirm UUIDs, actor, venues, unit and amount without fictitious invoice.
4. Reopen detail and/or verify idempotency **only with the same intention stored**without issuing a new transfer with new key.
5. Trying to origin=destiny and amount exceeding balance: block or receive 409 **sin alterar stock**.
6. Switch to TEST Company B: do not display products or transfers of A.
7. With Miguel (TRABAJADOR), check access and permission behavior: if not assigned to STORE **to both headquarters**, FastAPI must refuse the transfer. Do not modify memberships just to force success.
8. Verify that WALOS/DEMO remains independent.
9. Upon simulated interruption of API for QA, confirm recovery with **same key and body** after F5; avoid a second shipment by mistake.

**Warning:** repeat POST with **other key** creates a new operation; do not use it as a replay test.

## 6. Next block

T08-4 will integrate **initial stock and versioned adjustments**, by means of `adjustment_router.py` y `adjustment_schemas.py`: `kind`, `quantity_milli`, `expected_version`, `reason`, `location_id`. Before 409 per obsolete version is required **refresh, review and new human confirmation**, do not recalculate differences or automatically try again.

T08-5 will consolidate QA full-stack real/DEMO and unique T08 merge preparation, always after validating each subincrement. **No request or merit is made in this planning.**

## 7. Effective implementation of the frontend — 10/11/2026

### New Files

- `frontend/src/features/inventory/realTransferGateway.ts`: strict contract `POST /transfers` con `Idempotency-Key` UUID4, `GET /transfers/{id}`, standard motifs like backend, exact entry in thousandths with `BigInt` and operation/actor/headquarters/articulate verification and two signed movements. No automatic retrying or `demoStore`.
- `frontend/src/features/inventory/transferPendingJournal.ts`: IndexedDB independiente de T06/T07, scope `actorId:businessId:inventory.transfer`. Transactional reservation and reading verification **before POST**; key and body unchangeable, only one pending attempt per actor/company. It does not save credentials, Bearer, password, email or DEMO data. Operating data remain **unencrypted** in the browser; user consents. If IndexedDB fails, mutation is blocked.
- `frontend/src/features/inventory/RealTransferPanel.tsx`: form by physical article ASSETS, two active sites with `can_store=true`, exact quantities, reason and consent to persistence; consult source balance by specific GET before confirming. `window.confirm`, disabling double clicks; if the result is uncertain, retain key/body and **Never** forwarding automatically. User can review balances/history, retry **the same key** by explicit action, or discard only after stating that you verified and confirmed again. Successfully displays operation ID, two deltas and query details by GET.
- `frontend/src/features/inventory/RealInventoryPage.tsx`: Launch the form from the REAL inventory and re-check balances/movements in FastAPI when confirming. It continues to allow filters, history and traceability T08-1/2.
- `frontend/src/features/auth/auth.css`: responsive form styles, balance consulted, amber pending and green confirmation.
- `frontend/tests/transfer-real-api.test.mjs`, `frontend/package.json` y `.github/workflows/plataforma-pyme-frontend.yml`: command `npm.cmd run test:transfer-real` incorporated into the IC.

### Major guarantees and limits

- The balance shown is read-in, **no booking**: FastAPI revalidates availability with conditional UPDATE and atomic transaction, so a 409 of continuance is normal and does not cause automatic retry.
- The button appears for the active company with eligible locations and items; **the actual STORE permissions are those of the server**. A worker without assignments to both FastAPI headquarters can be refused with 403. No creation or change of assignments to enable it.
- The answer is accepted only if it includes **exactly two.** movements, one `TRASLADO_SALIDA=-quantity_milli` at source and one `TRASLADO_ENTRADA=+quantity_milli` in destination, both with the same `inventory_operation_id`actor and article.
- A 201 (creation) and a 200 (replay of the same key/body) are presented as confirmation, **no** like two different transfers.
- The GET per ID does not recover a POST whose identifier never arrived. Uncertain result is used history/salts and eventual replay **identical**Never new automatic key.
- No tax vouchers are created, no balances are edited on the frontend and no account/box is changed.
- Intent records persist only in the browser where they originated and may remain unencrypted until explicit cleaning; do not use shared equipment.
- T08-3 does not require backend changes or migrations. It does not modify initial inventory/t08-4 adjustments.

### IQ and testing

GitHub Actions #42855668226, implementation commit `7dc23ba`: **ambos jobs SUCCESS**.

- **Frontend: SUCCESS:** `npm ci`, `npm run build`, `npm run lint` **0 warnings y 0 errors**.
- **Frontend tests: 204/204 approved** (14 new tests in `test:transfer-real` and 190 pre-existing); **test:inventory-real 25/25** No regression.
- The Vite warning is retained by chunk JavaScript over 500 kB, without modifying thresholds or silencing. The form was also corrected to clear the destination when changing its origin and blocking the button during the indexedDB identity reservation. Invalid GET response (read only) of successful POST with invalid DTO (uncertain result: keep the attempt); these cases are proven.
- **Chromium desktop and mobile: SUCCESS**. Its current routes are **DEMO**, no pruebas full-stack de POST transferencias con PostgreSQL.
- T08-3 tests include: POST Bearer and Idempotency-Key, 200 replay, historical GET, unit validation and motif, two movements with shared actor/headquarters/ID, HTTP 401/403/404/409/422, uncertain timeout/red, key preservation after F5, actor/tenant isolation and closed rejection of corrupt and new body registration.
- A previous execution detected a test that expected rejection of line jump in motive; it was corrected because the backend normalizes spaces and line breaks. The last frontend execution is approved.

### Human QA pending

1. `git pull --ff-only origin feature/e2-7-t08-inventario-real`, ejecutar `npm.cmd run test:transfer-real`, `npm.cmd run test:inventory-real`, `npm.cmd run build` y `npm.cmd run lint` from `plataforma-pyme/frontend`.
2. With FastAPI and Healthy Postgres, open `http://localhost:5173/real/login`, enter as holder of **TEST Company A** → REAL Inventory → **Transfer between locations**.
3. Elegir `Producto A TEST`, origin `Sede A TEST`, destination `Sede A TEST 2`. Check the balance using GET **before confirming**If you are still in 11 and destination had no record, transfer **1 UNITY**, motive `Reposición de sede secundaria`Confirm.
4. Expected result if the balances did not change before the operation: **origin 10, destination 1**history with **−1 at source and +1 at destination**, related by a single transfer identifier. **No** assume fixed balances or repeat the POST of that operation with new key.
5. Open "View identifiers" of the result, then "Review updated balances and history" and check data read from API. You must not modify DEMO or previous history.
6. Test destination=origin, invalid quantity/service and insufficient balance **without making a new valid transfer**. The frontend must lock and/or API return 409 unchanged.
7. Switch to account Miguel: no STORE permissions **to both headquarters**, an attempt must receive 403; keep the pending of that actor if POST was sent and not invent permissions.
8. Check Company B and WALOS/DEMO remain isolated.
9. **Optional and controlled network failure test**: stop the API only once a new attempt has been booked, review the message of uncertain result, F5 and re-login; the record will have to reappear with the **same key and the same body** and never forward yourself. Do not use proof of a confirmed transfer that has already been cleaned.

**Prohibited:** stop/eliminate PostgreSQL volumes, force roles, create second key to mimic a replay, assume success by simulated tests or merge PR #41 before T08-4/5.

## 8. Closing criterion

The sub-increment **T08-3 is ready for manual testing**, not yet approved in Real PostgreSQL. Close once checked 201/200, balances, exactly two movements, A/B isolation, STORY permissions and DEMO regression. Race cases >100 movements and loss of response will remain in T08-5/T11 when requiring full-stack orchestration.

## 9. REAL functional evidence received — 10/11/2026 (partial confirmation)

The user attached four browser captures after running a transfer from the account holder of **TEST Company A**. Unlike the initial example of 1 unit, **the operation actually carried out was 3 UNIT**: must not be documented as a transfer of 1 unit.

| Paso | Evidence observed | Outcome |
|---|---|---|
| Form before POST | `Producto A TEST · UNIDAD`, **Headquarters A TEST** origin, **Headquarters A TEST 2** destination, **quantity 3**, reason and consent; balance read by API **11 UNITY** at source | **Approved** |
| Prior confirmation | Explicit dialogue confirms article, **3 units**, headquarters and atomic operation in backend | **Approved** |
| POST / response / GET per ID | Display **‘Reconfirmed transfer’**, 3 units, date/time, two linked movements, output **−3 UNITY** and entry **+3 UNITY**; ID check message | **Approved in interface** |
| History of home | **4 charged moves: 3 inputs and 1 output**; new ‘Send forward’ output **−3** precedes the previous receptions **+5, +4, +2** | **Approved in interface** |
| Updated stocks | Theoretical balance of origin **11−3=8**; at destination expected **+3** on its prior balance, to be consulted | **Pending evidence in the Stock tab** |
| Destination history | It should include ‘Received transfer’ **+3**sharing `inventory_operation_id` with the exit | **Specific catch pending** |
| Workers' permits, 403 per unallocated seat | Still no manual test specific to T08-3 | **Pending** |
| Tenant B and DEMO after transfer | Still no test after T08-3 transfer | **Pending** |

**Comment:** the form shows a query (11), but this reading is not taken as proof of final balances. The confirmation screen does validate that the API returned a coherent output and input. Separately verify post-operation balances and, if possible, the two lines of history filtered by headquarters. The user already executed the transfer: **not repeat it or create another key to test the same action**.

**Next recommended verification:** REAL Inventory → Stocks, check origin **8 UNITY** and destination **3 UNITY** only if the latter was starting from zero. Check the destination headquarters history for entry +3 and the same operation identifier. Then validate permissions and isolation. `main` until complete T08-4/5.

## 10. Second round of manual evidence — 10/11/2026

The user sent five additional catches after the transfer of **3 UNITY** The post-op readings were contrasted, without repeating the transfer or writing new movements.

| Ctrl | Displayed data | Verdict |
|---|---|---|
| Source stocks | TEST Company A → **Headquarters A TEST** → Product A TEST: **8 UNITY**version **4**updated **10/11/26 14:06** | **Approved** |
| History of origin | **4 charged moves**, **3 inputs + 1 output**. Transfer sent **−3** at **14:06**; previous purchases +5, +4, +2 | **Approved** |
| Destination stocks | TEST Company A → **Headquarters A TEST 2** → Product A TEST: **3 UNITY**version **1**updated **10/11/26 14:06** | **Approved** |
| History of destination | **1 charged movement**, «**Transfer received**» **+3**, to the **14:06** | **Approved** |
| Target traceability | Real UUID movement, actor, headquarters, article, **inventory operation** and type **TRANSFER** | **Approved** |
| Conservation invariant | **11 = 8 + 3** after the operation; before, **11 + 0** | **Approved** |
| Correspondencia exacta de IDs | You can see the operation ID of the input, but **the displayed traceability detail of the output was not attached**, to literally confront the two `inventory_operation_id` | **Timely visual comparison pending** |
| Permissions and isolation | There is no new evidence of T08-3 for under-accessed worker, Company B and DEMO | **Pending** |

### Unfunctional visual finding (corrected in branch)

The leaked history of the second site showed "In the **1 stroke** Loaded: **1 entries** and 0 outputs.’ No balances, signs, operations or permits affected.

> In the loaded movement: **1 input and 0 outputs**.

The same rule now includes 0, 1 and N inputs/outputs and the singular matching. An automated regression test was added. **IC verified and approved:** GitHub Actions #4286232601 for the code commit `0e234c4`: **205/205 Frontend tests**including **26/26 inventory** y **14/14 Transfers**; build aprobado, lint **0 warnings and 0 errors**, Chromium approved desktop/mobile. Only the large Vite bundle notice persists.

### Updated criterion

**Main REAL transfer circuit: Functionally accepted** with evidence of balances and leadger in both locations. **all T08-3** approved until verification of the STORE, A/B isolation, DEMO and shared ID permissions in the source detail. Do not repeat the transfer of 3 units; its persistent result is already proven. The branch remains open and PR #41 remains in draft, **sin merge a `main`**.

## 11. Third round of QA — 10/11/2026 (traceability, subsequent balances, tenant)

The user attached five additional catches and reported "Verifications completed well I believe." **verifiable catches** son:

| Ctrl | Evidence | Verdict |
|---|---|---|
| Shared transfer ID of 3 UNIT, origin vs destination | Both details show `efeff7f6-5f82-475b-b29b-bf0b53d778e6`responsible `dd64a12c-a6bc-4d20-941e-533967b1a341`, same article and type of operation `TRASLADO`; exit **−3**, input **+3** | **Approved** |
| Separation of movement | Different motion IDs for each location, with the same operation ID | **Approved** |
| New additional transfer | At **14:23** Catches show another transfer **−1 origin, +1 destination**It's a **Different operation**, after the transfer of 3 units of 14:06. Do not attribute it to Miguel or to the holder without account/actor evidence | **Confirmada en el ledger** |
| Post-origin balance | **7 UNITY** at Headquarters A TEST, version 5 | **Approved** |
| Post-entry balance | **4 UNITY** at Headquarters A TEST 2, version 2 | **Approved** |
| Transfer Invariant | **7 + 4 = 11 UNITY**, same total as before both transfers | **Approved** |
| Added history | **7 charged moves: 5 inputs and 2 outputs**, consisting of 3 receptions and 2 transfers of two movements each | **Approved** |
| Insulation by company | TEST Company B presents **0 item/headquarter combinations**; no stock of TEST Company A | **Approved in consultation** |
| DEMO | The user reports that the checks were completed well, but **There's no DEMO capture in this round.** | **Acceptance reported, no specific visual evidence** |
| Authorization of Miguel | The captures show no active session or identity of the actor of the transfer of 1 unit; therefore it does not demonstrate a rejection 403 alone when missing allocation STORE to origin/destiny | **Pending specific negative evidence / T08-5** |

**Closing decision:** T08-3 has the circuit **Main functional approved**, with validated traceability and preservation; integration of QA negative permits (worker without access to one of the headquarters), DEMO regression and controlled failures **remains expressly in T08-5** The second transfer of 1 unit must not be re-run only to "complete" the act. PR #41 is not merged or modified `main`.

**Next block:** T08-4, initial inventory and versioned adjustments with `expected_version`, conflict resolution 409 and non-regression of transfers/receptions. The new evidence base is **origin 7 UNITY / destination 4 UNITY** These values are historical evidence, not constants to codify.

## 12. Reconciliation T08-3 → T08-5, pre-merge review

The original checklist (sections 5 and 7) is a **plan**, not an execution record. Its initial numbers 11→10/1 were illustrative; **the first transfer was effectively confirmed was 3 UNITY**, origin **11→8**, destination **0→3**; a second separate transfer was 1 UNIT, with final balances **7 y 4**, constant total **11**. Manually checked output/entry, shared ID `efeff7f6-5f82-475b-b29b-bf0b53d778e6` The transfer of 3, history, isolated B and read back. There is no reason to recreate any of those operations.

| Pending verification of historical rounds | Subsequent evidence and scope |
|---|---|
| Workers without STORE in one of the headquarters: rejection 403 | **Not performed manually**; validated by `test_transfer_api_integration.py::test_employee_requires_store_assignment_at_both_locations` in PostgreSQL ephemeral. Do not change local assignments to simulate it |
| Source=destination, undue amount and rejection of invalid operation | **No complete manual negative path**; covered by `frontend/tests/transfer-real-api.test.mjs` PostgreSQL integration tests |
| Recovery with response cut and F5/re-login | **Not performed manually**, was optional; approved with Playwright REAL in API/PostgreSQL ephemerals, both for transfer and adjustment, without automatic POST |
| Repeated key after loss of response | Automatically checked as `201` initial and `200` replay, without duplicating movements; do not play with new key on local base |
| DEMO regression | **Manually checked in round T08-5**, plus 6/6 Playwright DEMO desktop/mobile tours |
| Transactional integrity, powerlessness and continuance | Suites `test_transfer_api_integration.py` y `test_transfer_concurrency_integration.py` approved with real PostgreSQL in IC |

**Technical closure:** GitHub Actions #42896686337: 879 backend, 256 frontend, 4 Playwright REAL, 6 Playwright DEMO, all approved. Functional acceptance T08-3 is preserved; no automated case is presented as a manual capture.

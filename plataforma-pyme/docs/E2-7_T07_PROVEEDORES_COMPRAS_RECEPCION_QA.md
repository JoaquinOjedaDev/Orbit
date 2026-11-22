# E2-7 T07 — Real integration of suppliers, purchases and reception

**Status:** incremental closure review technically approved on 11/10/2026; QA traceability is preserved pending for T11. `E2-7_T07_CIERRE_REVISION_Y_PRUEBAS.md` before merging.  
**Rama:** `feature/e2-7-t07-proveedores-compras-recepcion`  
**Base:** `main` `fed4f8282fed964cdfb00bf96c07a5ab71e7eb75` (T06 integrated).

## 1. Scope and contracts

This delivery connects UI REAL to existing FastAPI endpoints. It does not change backend, Alembic, DEMO data or enable actual sales/box.

| Action | Endpoint, relativo a `/api/v1` | Condition |
|---|---|---|
| Listing Suppliers | `GET /businesses/{id}/suppliers?offset=n&limit=100` | Active membership and reading permission; active and inactive |
| Create Provider | `POST /businesses/{id}/suppliers` | Holder/Manager only; mandatory name |
| Enable/disable | `PATCH /businesses/{id}/suppliers/{supplier_id}/status` | Holder/Manager only |
| List Shopping | `GET /businesses/{id}/purchases?offset=n&limit=100` | Business reading; all situations |
| Detalle de compra | `GET /businesses/{id}/purchases/{purchase_id}` | Historical Snapshots |
| Register purchase | `POST /businesses/{id}/purchases` | `Idempotency-Key: UUID4`; 201 alta / 200 replay |
| Receive purchase | `POST /businesses/{id}/purchases/{purchase_id}/receive` | `Idempotency-Key: UUID4`; 201 reception / 200 replay |
| Check reception | `GET /businesses/{id}/purchases/{purchase_id}/receipt` | History, movements and balances |

The UI generates and validates UUID4; it does not build them from DEMO IDs or publish them as tokens. The backend checks company, permissions, status, article/supplier and destination again.

## 2. Significant commercial semantics

**Register purchase DOES NOT modify inventory.** A document with immutable lines, amounts and snapshots is saved. Purchase with some physical good remains `REGISTRADA` and must be received later, selecting headquarters. A purchase consisting only of concepts or services remains `CERRADA_SIN_RECEPCION`.

**Confirm receipt YES increases actual stock.** It is integral, irreversible from this screen, atomic and destined to a single active headquarters with `can_store=true`. It does not allow manual quantities or partial receptions. The backend service again checks that the physical items are active, maintain type/unit, that the actor can operate at headquarters and that the stock does not exceed limits. An identical retry with the same key returns historical proof and does not duplicate stock. If the purchase has already been received with another key, it is appropriate to verify voucher, not create a new attempt.

Calculation: amounts in `quantity_milli` (in total in thousandths) and costs `unit_cost_cents` Total per line = `HALF_UP(quantity_milli * unit_cost_cents / 1000)`, con **BigInt** to avoid numerical imprecision, in line with Python. `UNIDAD`, `PAQUETE`, `CAJA`, `SERVICIO` y `CONCEPTO` require multiples of 1000.

The form allows lines linked to the REAL catalog (with derivative unit) or free concept (without stock). Up to 30 lines. Purchase is allowed without supplier. Catalog selection and suppliers are on loaded pages: if there are more than 100, the screen offers to load more and does not presume that it saw everything.

### 2.1. Unit cost proposed from catalogue (improved UX of T07)

**Business and architecture decision:** el `reference_cost_cents` of the article is NOT the `unit_cost_cents` The first is a valid reference and editable in the catalogue; the second is the historical value actually agreed with the supplier and it is fixed in each line of the purchase.

- Al **select an article** from the REAL catalogue in a new line, the UI proposes `reference_cost_cents` converted to weights with two decimals, without multiplying floating numbers.
- The unit cost field **remains editable** to charge the exact amount of supplier voucher; modify quantity, supplier or date does not replace the edited cost.
- `reference_cost_cents = null` means uninformed reference cost: field remains **empty**It's not interpreted as zero. `reference_cost_cents = 0` is zero reported and proposed as `0,00`.
- When you re-select another article, the cost of the new item is proposed; when you move to free concept, the cost becomes empty. The lines recovered from IndexedDB after F5 retain the original cost blocked: they are never recalculated from the catalog.
- When the unit cost entered exceeds the **current sales price** (`price_cents`), the interface displays a warning **information, not blocking**. There is no comparison if the selling price is missing or if the amount is still empty/unvalid.
- Create or receive a purchase **does not automatically modify** the reference cost, the sales price or the catalogue tab. Updating references would be another explicit decision and another command.
- No real margins are inferred without considering expenses, discounts, taxes and unit differences; the warning only detects a simple comparison per unit.
- FastAPI/DTO contracts, `quantity_milli`, `unit_cost_cents`, snapshots e idempotencia permanecen **no change**. It is an improvement of form, not data model.

**Witness case (TEST Company A):** `Producto A TEST` has a sales price of $1,500.00 and reference cost $800.00. When choosing it in a new purchase is suggested **$800,00**, which can be replaced by **$2.000,00**, generating a warning without preventing POST. The historical example already created by the user preserves **2 UNITY × $2.000,00 = $4,000,00**; should not be mutated to reflect the suggestion.


## 3. Recovery of outstanding operations

Unlike suppliers, the high purchase and reception rates are **replay idempotente server-side**. The pattern of T06 applies:

1. Before POST, save the actor, tenant, type of operation, UUID4 and EXACT body to IndexedDB.
2. If storage fails, it will abort before sending.
3. If you lose response, no second automatic command is triggered.
4. After F5 and login, the shopping screen recovers the creation slope per actor/company. It displays the original unchangeable lines and allows you to check history before retrying exactly the same key and body.
5. For receipt also the purchase and seat ID is saved; the slope is restored when selecting the purchase. `GET /receipt` exposes `request_id` and allows reconciliation. If it matches the local key, it is cleaned without repeating POST.
6. The local registration is cleaned only after confirming response, confirming proof by matching request-id or discarding informed manual of a purchase. A move or document from the backend is never deleted with it.

**Limitations and privacy:** Browser indexedDB is not encrypted; you can save commercial purchase data (line, notes, costs). It does not contain passwords, token Bearer or invitation secrets. Use only with test data and not on shared computers. It is limited to 60 records per source, do not purge silently; more than 30 days require review in the product closure. Delete browser data destroys pending; on another computer they are not transferred. Persistence only protects against F5/falls when IndexedDB is available.

**Suppliers:** API lacks an idempotent key. A provider discharge is not automatically persistent/repeat for uncertain response; the IU requests to consult suppliers before a new action.

## 4. IU and archives

- `/real/empresas/{id}/proveedores` — real suppliers per tenant, initial discharge by name and status, pagination.
- `/real/empresas/{id}/compras` — paging history, registration with articles/costs, optional supplier, receipt of goods at headquarters, proof.
- `frontend/src/features/purchases/realSupplyGateway.ts` — DTOs, routes, HTTP validation, cents and thousandths.
- `frontend/src/features/purchases/purchaseCostProposal.ts` — pure functions to propose cost of catalogue and detect higher cost at sale price; **no realizan PATCH ni POST**.
- `frontend/src/features/purchases/supplyPendingJournal.ts` — lasting intentions per actor, undertaking and purchase; unchangeable body check.
- `frontend/src/features/suppliers/RealSuppliersPage.tsx` y `frontend/src/features/purchases/RealPurchasesPage.tsx` — independent hearings of DEMO.
- `frontend/tests/supply-real-api.test.mjs` + `npm.cmd run test:supply-real` — contracts/roles/tenancy/balance.
- El workflow de frontend incorpora `test:supply-real`No changes were made to backend contracts.

## 5. Windows Commands — from `plataforma-pyme/frontend`

```powershell
git pull --ff-only origin feature/e2-7-t07-proveedores-compras-recepcion

npm.cmd run test:supply-real
if ($LASTEXITCODE -ne 0) { throw 'Falló test:supply-real' }
npm.cmd run test:pending-commands
if ($LASTEXITCODE -ne 0) { throw 'Falló test:pending-commands' }
npm.cmd run test:catalog-real
if ($LASTEXITCODE -ne 0) { throw 'Falló test:catalog-real' }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Falló build' }
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw 'Falló lint' }
```

To browse: API/Postgres Docker active, run `$env:PYME_API_PROXY_TARGET='http://127.0.0.1:18000'; npm.cmd run dev` and open `http://localhost:5173/real/login`.

## 6. Manual QA with existing TEST companies

| Test | Action | Expected |
|---|---|---|
| T07-01 | Company Owner A → Suppliers, create `Proveedor A T07` | Figure only in A; B does not see |
| T07-02 | Disable/reactivate provider | Persistent status after updating |
| T07-03 | Create `Compra A T07` with active REVANTA article from Catalogue A, `UNIDAD`, quantity `2`, costo `1250,55` | Purchase `REGISTRADA`total $2501,10, **no stock increased yet** |
| T07-04 | Open purchase and confirm receipt at `Sede A TEST` | Purchase pass to `RECIBIDA` and create real input movements/sales |
| T07-05 | Check receipt voucher | Same `purchase_id`, `location_id`, `request_id`; does not duplicate stock |
| T07-06 | Create purchase only with free concept | `CERRADA_SIN_RECEPCION`; no button to receive |
| T07-07 | Company B → Suppliers and Purchases | No A documents or suppliers are shown |
| T07-08 | Company Worker To Consult Shopping/Suppliers | Reading without registration form; effective permissions are rechecked on server |
| T07-09 | A Worker Tryes Direct Purchase URL B | `404`, no B data |
| T07-10 | Interrupt API BEFORE you send a trial purchase | IndexedDB; F5/re-login Earrings recovers key and body; manual retry only one purchase |
| T07-11 | Interrupt API before confirming receipt | Same key/headquarters after re-login; check receipt before retry; no double entry |
| T07-12 | Backend replay test with identical key | 201 first, 200 second; single document and stock |
| T07-13 | Try to receive at paused/can_store-free venue | Rejection 409, stockless |
| T07-14 | DEMO `/inicio` | No changes in simulated accounts, expenses, purchases or stock |
| T07-15 | Catalogs/suppliers 101+ and purchases 101+ | Real Pagination, No Incomplete Lists Taken as Complete |
| T07-16 | In new purchase, select `Producto A TEST` | Suggested cost $8,000.00 from catalog, editable field |
| T07-17 | Replace suggestion with $2.000.00 and change amount to 2 | Keeps $2.000.00, displays warning about sale $1.500.00 and **does not block** |
| T07-18 | Article with uninformed reference cost (`null`) / explicit zero (`0`) | Empty / `0,00`; both are correctly distinguished |
| T07-19 | Reopen historical purchase, return to catalog | The original purchase retains its cost; the item sheet is not automatically modified |
| T07-20 | Recover an outstanding purchase after F5 and new login | Cost saved and unchangeable; not replaced by updated reference |


Failure tests are performed only with test data and the Docker API. Do not remove PostgreSQL volume. Do not simulate a 201 lost in productive data; for an end-to-end exhaustive test, it is appropriate to use temporary isolated PostgreSQL and a controllable proxy.

## 7. Door closing

Do not merge T07 without approved IC, local tests, supplier creation, document with concept and goods, receipt with real movement, permissions per tenant, manual retry test and intact DEMO. Document that the reading of detailed actual inventory balances will be addressed in T08; T07 only shows proof.

## 8. Evidence of QA of T07 and integration status

**Confirmed with user-shared catches (10/11/2026):** Company A shows suppliers buttons and REAL purchases; `Proveedor A T07` was created, disabled and reactivated; a purchase of **2 UNITY × $2.000,00 = $4,000,00** registered without stock, then confirmed as **RECEIVED** with 1 real stock movement; the subsequent reading of the voucher confirmed reception at a headquarters, without forwarding the POST. The transient signal 404 that had appeared did not appear again in the last reading.

**Closing update of 10/11/2026:** The central cases described above were completed and are recorded in sections 9–16. `E2-7_T07_CIERRE_REVISION_Y_PRUEBAS.md` presents the 165 frontend tests approved in IC, 6 Chromium DEMO routes, manual evidence with PostgreSQL, limitations of scope and additional criteria transferred to T11. Do not confuse this conformity of increase T07 with the closure of all integration E2-7.

**Later integration:** The T08 module must use actual receipt entries and balances, without infering stocks from reference costs. Subsequent reports should distinguish `reference_cost_cents` of the current `unit_cost_cents` This rule is transmitted to the T12 closing documentation and any IU that integrates purchases/catalogue.

## 9. Decision UX T07: amount per line and supplier of purchase

**User-approved design (10/11/2026):** the provider is selected **only once in the header of each purchase**, not repeated by line. A purchase may contain multiple products, services or concepts from the same supplier. If suppliers differ, separate purchase documents correspond. The purchase without supplier remains valid under FastAPI's contract.

Each row shows in the same row, from left to right:

1. **Quantity** (editable, up to three decimals per unit).
2. **Unit cost of this purchase** (editable, preloaded with reference cost where available).
3. **Total cost of line** (wider and visually prominent; calculated automatically).

El subtotal **no se repite** in a text formula or in a second block. `Editar` next to the total field enables a **explicit edition by total**. While the user changes the total, quantity and unit are temporarily blocked; you must press `Aplicar total` o `Cancelar` before registering the purchase. If applicable, a `unit_cost_cents` compatible with the quantity and it is verified that `HALF_UP(quantity_milli * unit_cost_cents / 1000)` be the amount entered. **No silent pennies allowed.** Some amounts cannot be represented exactly with current units and costs (e.g. 3 units for $10.00); in those cases the incompatibility is explained and editing is maintained without POST being sent.

The sum of subtotals of all lines appears only once, at the bottom of the form, as **Total purchase**. It is only a calculated preview: backend contracts remain the same and FastAPI recalculates the historical total in an authoritative manner. There is no additional total field sent to the API or automatic update of the reference cost of the catalog. The future functionality of *offer updating the reference cost* is registered as optional and explicitly authorized proposal, separate from the purchase discharge. No change in the sales price without an independent transaction.

**Presentation and calculation QA:**

- T07-21: 4 units at $8,000.00 → subtotal $3,200; the amount is not visually doubled.
- T07-22: edit total to $12.000,00 with quantity 4 → unit cost $3.00; information margin if you exceed the selling price.
- T07-23: 3 units with total $10.00 → validation of unrepresentable amount; do not round or register.
- T07-24: two lines 4800.00 and 22.000,00 → Total purchase $7,200, no float multiplication.
- T07-25: change quantity or unit → subtotal is recalculated; no reference in the catalogue is modified.
- T07-26: verify the form on narrow screens: Subtotal passes to the next row without losing tags or controls.

## 10. Decision UX T07: Distinguishing receipt pending confirmation

**Additional user request (10/11/2026):** checks on **Confirm receipt** should not have the appearance of complete operation. Visual communication depends exclusively on `Purchase.status` returned by FastAPI, not the user has opened the reception screen.

| Backend State | Label shown | Style |
|---|---|---|
| `REGISTRADA` | **REGISTRADA · PENDING RECEPTION** | Amber insignia; button *Pending · Confirm reception at location* also amber |
| Receive form to be confirmed | **Confirm Real Reception** / **Retry Same Reception** | Main action amber, never green; button disabled without selected seat |
| `RECIBIDA` | **RECEIVED** | Real confirmation green sign; subsequent action only **Check voucher** |
| `CERRADA_SIN_RECEPCION`, `CANCELADA` | respective labels | Neutro, do not imply pending or successful reception |

El color **accompanying the text**, never replaces it: states are also distinguished by their name. Yellow/ambamber represents an operation to be confirmed; green is reserved for the record that already records as `RECIBIDA` In PostgreSQL. The reception button does not cause any mutation when opening the form: the writing continues to be executed only with confirmation, valid destination and the same idempotency/replay mechanism as before. No backend, data model, balances or permissions is changed.

**Additional QA:**

- T07-27: Newly created purchase `REGISTRADA` → amber tag and button; no green sign appears `RECIBIDA`.
- T07-28: confirm reception at active headquarters → in new reading appears `RECIBIDA` in green; disappears confirm button and appears *Check voucher*.
- T07-29: purchase only concept / cancelled → neutral style; never offer reception.
- T07-30: mobile mode and keyboard → readable contrast, visible focus, text status as well.
- T07-31: API rejects reception or loses response → do not paint green for optimism; preserve `REGISTRADA` until confirm from server.

**Traceability:** `frontend/src/features/purchases/realSupplyGateway.ts` exports semantic classification of the state; `RealPurchasesPage.tsx` applies classes according to that state; `auth.css` contains the amber/green/neutral styles. Automated tests validate mapping and calculations; interface testing must still be observed in the browser before T07 is closed. This chromatic criterion is included in the transfer to T08/T12, and in future modules receiving merchandise.

## 11. UX correction: error 404 when verifying pending receipt (collaborating QA)

**Actual QA observation (10/11/2026):** a worker with read-to-read access to `TEST Empresa A` recovered an intention to receive the purchase `Compra2 prueba E2-7 T07` in IndexedDB, pulsed `Consultar comprobante` and saw the generic red error “Provider, purchase, headquarters or company not available for this account”. The purchase remained visible as `REGISTRADA · RECEPCIÓN PENDIENTE`.

**Causa verificada en backend:** `GET /businesses/{id}/purchases/{purchase_id}/receipt` devuelve `404` both when the receipt still does NOT exist (`ReceiptNotFound`) as for certain resources not available/existed. The previous frontend confused the absence of proof with inaccessibility to a resource, without verifying the status of the purchase.

**Resolution in T07, no backend changes:** ante `404` de `GET /receipt`, consulted through **other GET** the details of the same purchase, authenticated with the same token and tenant:

- Si `GET /purchase` confirms that it is legible and follows `REGISTRADA`: show information notice "There is still no proof of receipt confirmed...", keep the original attempt and its key, without repeating POST or increasing stock.
- If the detail shows `RECIBIDA` but you cannot read your voucher: present explicit inconsistency and ask to review the access/server; **not to receive again**.
- Si `GET /purchase` devuelve `401`, `403` o `404`: respect the authentication/authorization/inaccessibility error. **Never** transform an inaccessible or foreign resource into a supposed pending purchase.
- Si `GET /receipt` devuelve `200`, check `request_id` and reconcile/clean the local key only when verifying the same operation, as before.
- In the event of a connection failure, do not claim that there is no proof; keep the intention and do not automatically try again.

**Important:** This improvement is for **consult**, not to grant permission to confirm receipt. `Reintentar MISMA recepción` FastAPI is still the one who validates the permissions of `STORE` an application failed for permissions cannot become successful from React.

**Automated testing:** `inspectReceipt` checks that case 404 + purchase registered does exactly two GET and zero POST; that the detail 404 is not disguised as no receipt; that it was `RECIBIDA` without receipt is inconsistency; and that a confirmed proof is read with a GET.

**Manual QA pending after adjustment:** with the working account, open the pending attempt, use `Consultar comprobante`, wait for not red notice if the purchase continues `REGISTRADA` and confirm that the retry button retains the original key, without new moves. If you then decide to complete the reception, check previously active assignment and permissions at headquarters, and do **una** explicit confirmation with the same key. Do not delete HTTP codes for other resources.

## 12. Visual detail of confirmed receipt voucher

**Decision adopted by the user on 10/11/2026.** During the reception test with the partner account, the purchase "Buy2 Test E2-7 T07" was confirmed and the backend correctly returned the receipt. However, the "Check Proof" button only showed a green message with UUID of the location. The expectation was to check a legible detail, not just a notification.

**Resolution T07 (frontend only):**

- ‘Check voucher’ executes the GET of the existing receipt, and upon obtaining a valid record presents an inline panel ‘Receiving details’ associated with its purchase, with status **CONFIRMED**.
- Includes purchase reference, name of the venue, date/time of confirmation, responsible, stock entry details and backend balances.
- The location is resolved by name from the REAL locations already consulted for the company; if it does not appear on the list, the name is explained as unavailable, leaving its UUID in the traceability drop-down section.
- The confirmed_by_id field of the server is used: when it matches the current session, session.user.display_name is displayed; if it corresponds to another person, its audit ID is displayed without inventing or disclosing private data from the computer. No worker-restricted membership readings are executed.
- Each movement and quantity comes from REAL voucher. Description and unit are obtained preferably from historical snapshots of purchase, not from current items; after_balances is used only when available. No fictitious movements are added for services or concepts.
- Receipt and location identifiers are under "Traffic identifiers", not as main text. The request_id key of the idempotent command is not published or copied.
- The panel notes that **is an internal FastAPI/PostgreSQL registry, not an invoice or PDF**. PDF export is not part of T07.
- The detail has "Close Detail" and design adaptable to narrow screens. When you consult from the reception form (located below the list), the browser focuses and shifts the view to the newly opened detail so that the user does not continue seeing only the form. It does not modify commercial status, inventory, roles, amounts or DEMO data.
- When a receiving POST ends with valid response, the same receipt may be presented directly, without making another POST. On consultation of a confirmed voucher, the pending key for request_id is still reconciled according to T06/T07. For an outstanding receipt, the handling of 404 in section 11 remains intact.

**Implementation:**
- frontend/src/features/purchases/RealReceiptDetail.tsx: vista legible.
- frontend/src/features/purchasings/receivetViewModel.ts: pure mapping of historical DTOs, venues, actor, thousandths and balances.
- frontend/src/features/purchases/RealPurchasesPage.tsx: opening of the voucher within the corresponding purchase.
- frontend/src/features/auth/RealAuthApp.tsx: shares display_name of authenticated user, without consulting private members.
- frontend/src/features/auth/auth.css: estilos responsive.
- frontend/tests/supply-real-api.test.mjs: name/ID tests for responsible, headquarters, snapshots and services without movement.

**Manual QA before merging PR #40:**

1. With Miguel, open "Buy2 test E2-7 T07" already RECEIVED, check proof and check headquarters "Sede A TEST", server date, responsible "miguel" (if it matches display_name of the session), +5 Product UNITY A TEST and later balance. The 2 service units should not generate inventory movement.
2. From the headline, read that same receipt: do not display a responsible name invented for the other user; show your identifier.
3. Check the first purchase received: you must present +2 UNITY without creating another movement.
4. Verify that the RECEIVED state remains green, that "Close Detail" works and that consultation never forwards a reception.
5. Check the narrow screen panel and audit identifier tags.
6. In purchases LOG IN without receipt, keep the notice of absence of proof and original key, without simulation of success.

**Transfer:** T08 must keep the separation between purchase vouchers and the global inventory leader. T12 must document that this view is proof **internal**, no electronic billing or PDF. Closing T07 requires browser captures and approved IC.

## 13. Visual evidence after detailed voucher — 10/11/2026

**Validated by browser capture of the user in the collaborating account (Miguel):** the "Check voucher" button of the actual purchase "Buy2 test E2-7 T07" opens correctly the "Reception Details" panel, status **CONFIRMED**location **Headquarters A TEST**, date/time of confirmation **10 nov 2026, 8:23 a. m.**responsible **miguel**, **1 actual inventory entry** de **Product A TEST +5 UNITY**, balance of **11 UNITY** and the explicit clarification that this is not a supplier’s invoice or PDF file. No fictitious entry of the service included in that purchase is presented. ‘Trafficking identifiers’ appears folded and ‘Close detail’ is available.

**T07 criterion for voucher: visually approved**, in addition to automated mapping tests. The reported balance value corresponds to the balance that returns the backend for that receipt, should not be deducted from the purchase amounts.

**Other evidence from the same QA route shared in the conversation:** the purchase is left `RECIBIDA` after explicit action authorized to a Worker with assignment to headquarters; the subsequent consultation confirmed the registration without making another POST. Previously, the partner account with headquarters `NO ASIGNADO` I could consult purchases but it was not authorized to confirm there. In Company B the shopping list was empty while Company A showed three purchases. The A worker's supplier screen was presented without administrative controls. Subtotals, the sum of the document, reference cost and amber/green color were checked by catch.

**Closing criteria pending complete manual evidence:** Direct URL of purchase of B as worker A (T07-09); controlled tests of interruption and recovery of high/reception with F5 in isolated environment (T07-10 and T07-11); independent check of replay backend (T07-12); paused/unstorage (T07-13); pagination 101+ (T07-15) and special amounts cases T07-18/T07-20/T07-23. Part of these situations already has unitary evidence/contracts, but that does not amount to manual evidence end-to-end.

**Closing decision:** not declare the fully validated increase or automatically merge by single capture. Keep PR #40 as a draft until you explicitly review and execute or justify the pending criteria, without creating additional stock movements just to validate a read view.

## 14. QA evidence of vendor isolation by company — 10/11/2026

**T07-07 (suppliers): visually approved.** The user opened the view **REAL Suppliers** de **TEST Company B**, authenticated in the real environment. The capture indicates ‘TEST suppliers Company B consulted in FastAPI and PostgreSQL. No DEMO data’, sample **0 loaded suppliers** and the empty state ‘No suppliers registered in this company’. **TEST Company A** showed **Supplier A T07**. Therefore, the A supplier is not listed in B. The reading did not perform any mutations.

The part of **purchases** T07-07 also had previous evidence: B showed 0 purchases and A showed 3. This observation confirms the isolation of listings in the IU, **does not in itself amount to an HTTP adverse test** access by ID to the foreign resource; that proof remains within T07-09 and the set of automated contracts.

**Status:** T07-07 complete in its interface scope. The other pending checks described in section 13 are continuing; do not merge the PR for this single check.

## 15. Evidence QA: purchase composed exclusively of free concept — 10/11/2026

**T07-06: visually approved with Real interface capture.** The user registered a fourth purchase of TEST Company A under the reference `concepto libre T07`, without supplier, with **1 line CONCEPT**, quantity **5** and unit cost **$500,00**; the summary showed **$2.500,00** and status **CLOSED WITHOUT RECEPTION**. No button was presented to confirm receipt or action to increase inventory.

**Scope of evidence:** arithmetic, commercial status and absence of reception action on the frontend connected to FastAPI/PostgreSQL were verified. Although the case initially suggested quantity 1, using quantity 5 is compatible with the same rule and shows correctly multiplication. The stock leadger was not compared in this test before and after, so the absence of movements is supported by IU behavior and backend rules/tests, but not by an independent inventory check.

**Not merged:** T07-06 moves from pending to approved in its interface scope; other criteria still outstanding are listed in section 13. No confirmation of receipt or modification of stock movements was required.

## 16. QA evidence of non-regression DEMO and REAL isolation — 10/11/2026

**T07-14: approved in revised manual scope.** The user opened the demo application after integrating the REAL modules of T07. He provided two screenshots and confirmed that the navigation and buttons he tested work properly, with WALOS example data and no visible mix with the companies TEST A/B.

**DEMO Inventory Capture:** tabs "Existences" and "History of movements", search filters and location, and six visible combinations of stocks per article/headquarter. We observe "hydrolyzed collagen" (Casa Propia 600 gram; San Martín Feria 380 gram), "Crema de enjuague" (Casa Propia 11 box; San Martín Feria 80 box), "Shampoo" (Casa Propia 8 unit; San Martín Feria 70 unit). **no actual balances of PostgreSQL**.

**DEMO Catalog Capture:** ‘Articles and services’ with 3 visible assets of 4, search/type/state fields, tokens for those same items, images, costs and DEMO prices, with actions ‘View tab’, ‘Edit’ and ‘Disable’. The user reported that the tested buttons responded correctly.

**Observable isolation:** No TEST Company A or TEST Company B records or combinations of stocks are mixed with the DEMO catalogue/inventory shown. Previous verifications in REAL areas also excluded DEMO records. These catches do not alone prove all DEMO routes (sales, expenses, other screens) nor authorize a full e2e battery to be affirmed; the result is limited to catalog, inventory, navigation and reported actions.

**Outcome:** T07-14 approved for non-regression of inspected views, without mutations of actual data and without needing to alter DEMO images or stocks. Maintain suites and regression controls for additional modules in T11. The remaining criteria in section 13 remain pending, to be reviewed before merging.

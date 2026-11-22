# E2-7 T08-2 — REAL History, Local Filters and Movement Traceability

**Status:** implementation completed, IC approved and **six approved manual functional tests T08-2** according to the user's catch and confirmation (10/11/2026). **PR #41 remains in draft, without meriting `main`.**

## 1. Objective and limits

Polish the module **REAL read-only inventory** built on T08-1, on existing FastAPI/PostgreSQL contracts. The server remains the **only source of truth** for quantities, balances, movements, authorisations and isolation per tenant. T08-2 **no** create stock, adjust quantities, confirm receptions or implement transfers.

**No change backend routes**PostgreSQL, Alembic, permissions, power, `demoStore` No commercial operations.

## 2. Functional changes

| Display / decision | Implementation |
|---|---|
| Legends of loaded records | Correct grammar: `0 combinaciones ... cargadas`, `1 combinación ... cargada`, `1 movimiento cargado`, `3 movimientos cargados`, with notice if pages can be left |
| History → type | Select `Todos`, `Solo entradas (+)`, `Solo salidas (−)` and the seven types of backend movement |
| History → search | Article name, SKU, venue, event label, movement identifier, actor and source records; insensitive search for tildes and capitals |
| Honest filter range | **Only logs that the browser already loaded**. The general endpoint does not have search by text/type/date; therefore there is permanent local filter warning |
| Visible totals | Count of **entries** y **exits** between loaded records, without confusing them with the stock of the business or adding them as if they were balance |
| Empty matches | The absence of movements in the server-side query is distinguished from the absence of matches in downloaded movements; if there are more pages, notice |
| Drop-down Traceability | `Ver trazabilidad` displays full movement ID, responsible, location and item, plus optional receipt/purchase line IDs, operation and type, sale/sale line if available |
| Design | Panel accesible con `details/summary`keyboard selection, copyable text and responsive composition |
| Continuity | Maintains server-side filters **by location and article**, `offset/limit=100`, `Cargar más`, cancellation of requests, handling 401/403/404 and REAL/DEMO separation |

### Semantic accuracy

- `receipt_id` es un **internal receipt voucher** (ID), **no** a supplier invoice or proof of payment. No links are invented for non-existent documents.
- `actor_id` is identified as ID; no names are invented or associated without further authorized query.
- Shown **Log IDs that the API has already authorized** This user and company. No external user is consulted or private data extracted from other companies.
- A name, SKU or unit comes from **REAL catalog currently loaded**, not from a historical snapshot of the line. If a tab was not downloaded, the partial identifier visible is retained.
- The summary `Entradas / Salidas` counts movements of loaded pages; does not express total historical tenant, consumption, or accumulated quantities.
- Local search does not make a new GET or replace server-side filters. **Load more moves** remains available when the endpoint returned a full page.

## 3. Files involved

- `frontend/src/features/inventory/inventoryHistoryView.ts` (new): pure functions for filters, partial totals, legends and traceability.
- `frontend/src/features/inventory/RealInventoryPage.tsx`: select, local search, summary, `details` and correction of legends.
- `frontend/src/features/auth/auth.css`: responsive layout, visible focus and text of full IDs without overflow.
- `frontend/tests/inventory-real-api.test.mjs`: nine new unit tests added to the existing command `npm.cmd run test:inventory-real`.

The remaining existing tests are maintained; no change to the contract `createInventoryGateway` or endpoints to add a `event_type` non-existent.

## 4. Automated matrix of T08-2

| Test group | Acceptance |
|---|---|
| 0 / 1 / multiple records | Texts and pluralization without errors; notice of pending pages |
| Inputs/outputs | Filtered by sign, without altering data or order of the backend |
| Evento exacto | Different reception for transfer and departure by sale |
| Local search | Accentos/case-insensitive, SKU, article, venue and event name |
| IDs de origen | Movement, actor, receipt and inventory operation |
| Reception detail | Existing IDs; not inventing invoice/sale |
| Details sale / transfer | Optional fields are not shown if they are absent or `null` |
| 100 loaded rows | No full server coverage is inferred and no future pages are accessed |
| Visible totals | Count rows of loaded pages; does not calculate stock or aggregate quantities |

**Evidence IC confirmed:** GitHub Actions run #42846238798, commit funcional `449bc5804a9cfb280b826540430f6c9bc04f5915`: **SUCCESS**. `npm run build` approved, `npm run lint` **0 warnings and 0 errors**, `npm run test:inventory-real` **25/25** (16 de T08-1 + 9 de T08-2), suites frontend **190/190** Cumulative and Job Chromium Desktop/Modial Approved (current DEMO streams; No E2E PostgreSQL). The first T08-2 execution had failed by two unclosed JSX expressions; they were corrected in commit `449bc58` The Vite warning size of chunk JS >500 kB remains visible, has not been silenced.

## 5. QA manual on TEST Company A (no mutations)

After updating the branch and open `/real/login`:

1. Ir a **TEST Company A → REAL Inventory → History of movements**. Expected with the known dataset: **3 charged movements; 3 inputs, 0 outputs**; reception +5, +4, +2 by Headquarters A TEST.
2. Elegir **Entry only (+)**: the three receptions remain. Choose **Only outputs (−)**: message appears **no matches between loaded records** (does not mean to ensure that historically there are no exits).
3. Elegir **Purchase reception**: follow +5, +4 and +2. Choose another event, for example `Salida por venta`: you should not show these receptions.
4. Search `producto a`, `Sede A TEST` The search is local on the loaded rows and you must announce it.
5. Open **See traceability** at the reception of **+5**: must show UUID movement, responsible, headquarters, item, receipt and purchase line. No invoice or PDF generated.
6. Alternate to **Stocks**: **11 UNITY** at Headquarters A TEST if no new movements; observe singular correct `1 combinación artículo/sede cargada`.
7. In the filter top choose **Headquarters A TEST 2**: Next **0 combinations and 0 movements**; both texts are now well pluralized.
8. Enter **TEST Company B**: only B. Log in as Miguel: REAL reading without adjustment or transfer controls.
9. Regression: enter DEMO/WALOS; articles and movements remain independent.

**Nota:** No need to recreate users or modify the purchases received. If the balance differs from 11, check the actual subsequent moves and do not alter the code to force that value.

## 6. Risks and delivery to T08-3 / T11

- **Concurrent Pages:** `offset/limit` does not offer transactional snapshots between pages. T08-1 already detects repeated IDs and allows updating. A scrolled/jumped row between pages may require a backend cursor mechanism in a later evolution; do not declare complete list with 100 accurate records.
- **Global scope filters:** type/text/date would be new server-side filters, with backend contracts and tests; **no** They're simulated here.
- **QA de gran volumen:** create synthetic dataset of >100 moves and check pageing without duplicating/omitting rows under continuance. Transfer to T11.
- **Documentary audit:** Internal receipt identifiers do not constitute billing documents.
- **T08-3:** REAL transfers with dual atomic movement and idempotency; different IU, role/location protection.
- **T08-4:** initial load and adjustments with `expected_version` and read more to 409.
- **T08-5:** integrated validation before merge to `main`. PR #41 continues as draft until full T08 is completed.

## 7. Technical outcome and next decision

Se considera **approved the main functional acceptance of T08-2** with manual tests of search, filter by type, traceability and balances; see evidence in section 8. Approval is from the reading sub-increase, **no** T08-3/T08-4 not yet developed; PR #41 is NOT merged.

## 8. Evidencia manual T08-2 — 10/11/2026

**Source:** six browser captures with TEST Company A in REAL Inventory and express statement of user having completed the six tests. It records only what the catches show or what the user confirms; no new SQL query or automated E2E test against PostgreSQL is affirmed.

| Criterion | Observed result | Verdict |
|---|---|---|
| Initial Product History A TEST, Headquarters A TEST | **3 moves** reception, **+5**, **+4**, **+2**; summary **3 inputs, 0 outputs**, descending order | **Approved** |
| Selector "Inputs Only (+)" | **3 matches** and the three receptions remain visible | **Approved** |
| Selector ‘Only outputs (−)’ | **0 matches**, message "No matches between the 3 loaded movements" without inventing outputs | **Approved** |
| Search by text without matches | ‘A TEST added product’ income; **0 matches** and correct message; user also confirms positive search test | **Approved** in reported scope |
| ‘See traceability’ at reception +5 | Se despliegan UUID de **movement, responsible, location, item, internal reception and line of purchase**; notice that it does not constitute invoice or proof of payment | **Approved** |
| Return to stock | **Product A TEST: 11 UNIT**, balance version 3, singular legend ‘1 item/loaded headboard combination’ | **Approved** |

**Conciliation:** +2 +4 +5 = **11 UNITY**, consistent with the balance confirmed in the history and T07 voucher. Summary 3-0 account moves **downloaded**Not global inventory.

**Decision:** T08-2 (history and read-only traceability) **functionally accepted**. The IC is still approved (25/25 inventory tests and 190/190 frontend in the last verified execution). There is no authorisation to merge full T08 to `main`; PR #41 remains in draft. **T08-3 transfers**, **T08-4 initial inventory and adjustments**, **T08-5 QA integral**, in addition to pagination of more than 100 rows and attendance that will be covered in the QA later.

# E2-7 · T08-1 — Real Inventory Reading, Balances and Movements

**Status:** T08-1 core reading validated in REAL browser and DEMO regression confirmed; PR #41 still in draft. **Do not merge to main before T08 closing review and authorisation.**

## Objective and scope

Integrate in React the **actual and exclusively reference reading** of stocks by article/location and signed movements, maintaining FastAPI/PostgreSQL as a source of truth and DEMO data isolated.

### Existing backend contracts, unchanged

| View | Method and URL relating to /api/v1 | Optional filters | Pagina |
|---|---|---|---|
| Stocks | `GET /businesses/{business_id}/inventory/balances` | `location_id`, `catalog_item_id` | `offset=0&limit=100` |
| Stock movements | `GET /businesses/{business_id}/inventory/movements` | same fields | `offset=0&limit=100` |

Ambos endpoints permiten `limit` 1 to 500 and require an opaque Bearer session and authorized membership. Backend limits resources to the user's company; the frontend also validates each `business_id`, UUID ID and filter parameters that return the server.

`StockBalanceView`: `business_id`, `location_id`, `catalog_item_id`, `quantity_milli` (integer >=0), `version` (>=1), `updated_at`.

`InventoryMovementView`: ID, company/headquarters/articulate/actor, `event_type`, `delta_milli` **signed**, `occurred_at`. El backend omite campos de origen `null` Admitting optional source fields does not mean inventing operations. Events: `COMPRA_RECEPCION`, `TRASLADO_ENTRADA`, `TRASLADO_SALIDA`, `AJUSTE_ENTRADA`, `AJUSTE_SALIDA`, `STOCK_INICIAL`, `VENTA_SALIDA`.

**No stock is calculated from purchases in the browser.** Receptions, sales, transfers and adjustments are accumulated in the backend and their result is consulted on the authoritative balance. Exact conversions in thousandths are used **sin multiplicar floats**; quantities are shown with sign when they are movements.

## Changes in frontend

1. `src/features/inventory/realInventoryGateway.ts`: HTTP gateway with GET-only, validated filters and pagination, secure DTOs and HTTP messages 401/403-404/42. Avoid accepting negative balances, invalid versions, anti-event sign movements, numbers outside the safe whole range, responses from another tenant and duplicate rows.
2. `src/features/inventory/RealInventoryPage.tsx`: visible section in `/real/empresas/{uuid}/inventario`, displays authenticated company, real locations, actual catalog loaded, filters and tabs "Existences" / "History of movements". You can load successive pages from each listing. When a page brings exactly 100 records, the system warns that **There may be more**He never claims he's consulted everyone.
3. `src/features/auth/RealAuthApp.tsx`: Authenticated path with UUID validation. Restarting session after F5 remains T02 policy; Bearer is not saved to disk.
4. `src/features/businesses/RealBusinessesPage.tsx`: "Real Inventory" button in business panel, not mixed with `/inicio` DEMO.
5. `src/features/auth/auth.css`: visual states of positive, negative and zero amounts; mobile responsive.
6. `tests/inventory-real-api.test.mjs`, `package.json`, workflow CI: independent automated battery `npm.cmd run test:inventory-real`.

### Historical data and filters

- Locations are consulted only from the selected company, and are shown even if they are currently paused because there may be historical balances and movements.
- Names/units are enriched only with tokens of the **REAL catalogue of that company**. The selector starts with 100 tiles; "Load more chips" is offered until reaching the last page. As long as the complete catalogue has not been read, an item without a loaded tab is presented by short ID, never by a DEMO name nor does it hide the movement.
- The backend orders balances by location/article and movements by descending date/ID; each list pages with its own offset. If a later page repeats an already loaded ID, the screen stops that pageing and indicates updating: **offset pagation does not represent a snapshot** if the stock changes while you consult.
- Only records returned by the API are observed. If no balances are recorded, it is said "No balances recorded" and **no** all items in the catalogue are said to have zero balance.
- Displaying a current catalog unit does not transform the historical value of movement; in the ledger quantities are shown as they were recorded.

## Planned automated evidence cases

- Ruta relativa y Bearer correcto, sin POST.
- Page 100/100, actual offset, exact API filters and 0.500 controls.
- UUID outside the company, headquarters/article filter ignored, malformed data, duplicates, answers of more than 100 elements.
- Balances 0, non-negative balances, version >=1, valid date and secure integers.
- All types of movement, positive/negative quantities and rejection of incompatible sign or zero delta.
- Optional source fields `null` or omitted (FastAPI `response_model_exclude_none=True`).
- HTTP 403/404 not replaced by DEMO data; network down and abort without mutations.
- Build, Lint, regression of already integrated frontend suites; existing Chromium remains a test **DEMO**, no un E2E REAL con Postgres.

## QA manual requested: T08-1

Make without modifying stocks, purchases or DEMO data.

1. In VSCode, work in `feature/e2-7-t08-inventario-real` and sync to origin.
2. `docker compose --profile api up -d --wait` from `plataforma-pyme`. En `frontend`, ejecutar `$env:PYME_API_PROXY_TARGET = "http://127.0.0.1:18000"` y `npm.cmd run dev`.
3. Ir a `http://localhost:5173/real/login`. Log in with the holder of **TEST Company A** and open **REAL Inventory** from the company.
4. Filter **Headquarters A TEST** y **Product A TEST**. Check balance. T07’s last proof showed **11 UNITY** after balance; if no further movement occurred at headquarters, the API should return the same balance. **Do not encode 11 as fixture or suppose it to be permanent.**
5. In "History of movements", corroborate an entrance by reception of **+5 UNITY** Product A TEST and the date of movement. If other purchases are received, your tickets must also appear.
6. Switch to **Headquarters A TEST 2** and note that the balances and movements correspond only to that headquarters, without mixing the A TEST headquarters.
7. Open **TEST Company B**: no balances or movements of TEST Company A should appear; an empty list is legitimate.
8. Enter as a worker Miguel: If your membership is active, you can check the tenant balance/history without seeing settings and transfers buttons (not yet implemented).
9. If a list reaches 100 records, "Load more" must move to offset 100, not repeat results. The article selector can also expand your tabs per page.
10. Open `/inicio`: check that DEMO Inventory and DEMO Catalog remain separate from actual balances.

**Do not execute transfers or adjustments to T08-1.** T08-3/T08-4 will have their own PR/validations. Any HTTP error or balance inconsistency is investigated before declaring the test approved.

## Transfer

- **T08-2:** complete history/UX and its acceptance cases with dataset of more than 100 movements.
- **T08-3:** Transfers between locations, double movement consistency and idempotent recovery.
- **T08-4:** stock and absolute/relative adjustments with `expected_version` and 409 conflict, reload the balance and re-approval of the user.
- **T08-5:** QA permissions, tenant, races, balance and regression, before the full increase merge.
- **T11:** Playwright full-stack with FastAPI/PostgreSQL on ephemeral basis and cases of network cutting, turnout, pagination and end-to-end traceability.

**Explicit limitation:** This T08-1 delivery is a reading of existing resources. It does not involve a finished commercial ERP or resolve accounts, cashier, QR or POS sales from T10.

## Result of the first automated validation — 10/11/2026

**GitHub Actions:** run #42818763338, **SUCCESS**.

- `npm ci`: approved installation.
- `npm run build`: `tsc -b && vite build`, compilation correct. The warning Vite by size of the chunk JS greater than 500 kB **remains visible**: issue of performance to be dealt with with with deferred cargo, the threshold was not raised or concealed.
- `npm run lint`: **0 warnings, 0 errors**. React's initial warnings on synchronous states in effects and references `.current` in cleanup were **corrected** by resets initiated by events and stable AbortionController cleaning, not muted.
- `npm run test:inventory-real`: **16/16 approved**, 0 bugs. Tests of GET, tenant, filters, pagination, validation of DTO and units, signs, abort and HTTP.
- Resto de las suites de frontend: **165/165 approved** according to group totals; **181/181 in total** including the 16 of T08-1.
- Job Chromium: approved. Your tours are for DEMO navigation (scritorio and mobile), it should not be said that there is Playwright full-stack REAL.
- **Limitation of evidence:** GitHub CI did not connect to PostgreSQL to verify the specific user balance; only contracts and mocks were reviewed. Manual acceptance T08-1 requires running the previous checklist and comparing with data of purchases received at TEST Company A.

**Decision of increase:** ready for browser review and code study; PR #41 will remain draft, without merit. The T08-3/T08-4 inventory mutations are not part of this implementation.

## Manual evidence T08-1 — consistent balance and leader (10/11/2026)

**Source of evidence:** two browser screenshots shared by the user during TEST Company A test, with REAL API. The result documents what was observed in the UI; no independent SQL query was executed in this review.

| Verification | Observed result | Status |
|---|---|---|
| Screen Stocks | 1 item/headquarter combination: **Product A TEST**, **Headquarters A TEST**unit **UNIT**, balance **11** | Visually Approved |
| Balance version | **3**updated 11/10/2026 **8:23 a. m.** | Visually Approved |
| Display History of movements | 3 moves `Recepción de compra` of the same article and seat | Visually Approved |
| History entries | **+5**, **+4**, **+2** units, in order from latest to older | Visually Approved |
| Arithmetic and consistency | 2 + 4 + 5 = **11**, coinciding with last balance of voucher T07 | Approved for displayed data |
| Last T07 movement | Receipt **+5** of Product A TEST, to the **8:23 a. m.**, coincides with previous visual proof of the worker Miguel | Visually Approved |
| Visible Pagination | 1 balance, 3 moves, «Last page consulted» | Matching for small dataset |

**Partial conclusion:** the two central cases of reading T08-1 (existing and history) in TEST Company A and the agreement with historical proof T07 are validated. No new inventory operation was recorded to verify this.

**Update after the following catches:** visual isolation TEST Company B without balances and the consultation from the employee account Miguel were already verified; see later section. **Not yet verified:** filter by Headquarters A TEST 2 and article, empty history in Company B, DEMO without regressions specifically in this branch and pagination with more than 100 entries. The IC covers the reading contracts, but these manual checks remain differentiated.

**Minor visual observation (not blocking):** with a single combination the text on the screen says "1 item/headquarters combinations loaded"; consider singularization of legend in polishing T08-1, without impact on balances.

## Additional manual evidence: Miguel and A/B companies account — 10/11/2026

**Source:** three catches of the REAL Inventory IU and textual confirmation of the user ("Walking well from the Miguel Account").

| Observation | Outcome | Scope |
|---|---|---|
| Company B → Stocks | `0 combinaciones artículo/sede cargados`; empty status: ‘No balances recorded for selected filters’ | **Visually approved:** does not show the balance or Product A TEST of A; no history of B was observed here |
| Company A → Stocks | `Producto A TEST`, `Sede A TEST`, **11 UNITY**version 3 | **Approved:** matches last T07 and previous capture of T08-1 |
| Miguel Account (TRABAJADOR in Company A) | The user states that he can correctly open this screen and check the REAL balance | **Approved in IU** for reading; capture alone does not prove an HTTP negative for modifications, which are not yet available in T08-1 |
| Stock exchange shares | No adjustment/transfer controls in view | **Design planned:** read-only module for all roles up to T08-3/T08-4; does not amount to demonstrating role denial |

**Partial result:** isolation of lists of balances between companies and reading as observed worker. Lack to execute the explicit selection of **Headquarters A TEST 2** (and preferably check the History tab with that filter), the filter per article, Company B history and DEMO regression for manual closure of this sub-increment. The base is not modified or fused PR #41 by these catches.

## Manual evidence — filter Headquarters A TEST 2 (10/11/2026)

**Source:** two user catches with TEST Company A and explicit filter **Headquarters A TEST 2 · ACTIVA**One for each eyelash.

| View | Visual evidence | Outcome |
|---|---|---|
| Stocks | 0 item/headquarter combinations; message "No balances recorded for selected filters. This does not mean that the entire catalog has zero balance" | **Approved** |
| History of movements | 0 moves; message "No recorded movements for selected filters" | **Approved** |
| Isolation by headquarters | Product A TEST not included with balance 11 nor the three receptions (+5, +4 and +2) of Headquarters A TEST | **Visually Approved** |

**Conclusion:** the operation of the server-side filter is verified by headquarters in both views, on the data set of this test. Headquarters A TEST balances and movements are kept separate from Headquarters A TEST 2. The empty response does not prove explicit zero balance. For the complete closure of T08-1, the filter per article, the regression DEMO in this branch and the pagination with large volumes remain to be reviewed, as desired. The contract coverage has already been executed in IC. The PR is not merged for this only evidence.

## Manual evidence of regression DEMO and main acceptance — 10/11/2026

**Source:** express confirmation of the test manager: ‘Demo continues to show its particular data without mixing any real evidence’. It refers to the continuity of DEMO environment after integrating T08-1; it does not represent an independent execution of automated e2e tests on PostgreSQL.

| Verification | Outcome | Evidence |
|---|---|---|
| DEMO WALOS: own data and existing navigation | **Approved in reported scope** | User confirms that DEMO data are kept private and without mixing REAL tests |
| REAL Balances in TEST Company A | **Approved** | 11 Product UNIT A TEST at Headquarters A TEST, version 3 |
| Ledger de la sede A TEST | **Approved** | Three real receptions: +2, +4 and +5; sum 11 |
| Filter Headquarters A TEST 2: balances and history | **Approved** | Both views empty, without dragging Headquarters A TEST movements |
| Companies A vs. B in balances | **Visually Approved** | B returns 0 combinations, no A balances |
| Consultation with worker Miguel | **Approved in IU** | The user was able to access the allowed data |

**Decision:** main functional acceptance of T08-1 completed for reading balances and movements, visual isolation by headquarters/company, reader worker and non-regression DEMO observed. **Not equivalent to full T08 approval or comprehensive QA security**. Explicit Earrings: manual filter per article test; empty B history under the relevant account; >100 rows and concurrent page changes; HTTP negative tests and Playwright full-stack against PostgreSQL (T11). A pluralization message "0/1 combinations" remains a non-blocking UX detail for the next polishing. **PR #41 remains open as draft, without merit**.

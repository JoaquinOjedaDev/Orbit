# E2-7 · T09-D — Real Sales History in React and QA

**Date:** 10/11/2026. **Rama:** `feature/e2-7-t09-consulta-recuperacion-ventas`; PR #42, **draft, without merit**. T09-D corresponds to **historical reading-only consultations**, no al POS de T10.

## Contract and route

- Access: in REAL mode, **My companies → Company → Real Sales History · consultation**, o `/real/empresas/{business_id}/ventas` (IDUID of the company). DEMO routes remain separate.
- `GET /api/v1/businesses/{business_id}/sales?offset=0&limit=50[&location_id=...]`: abstracts, order from the newest to the oldest, permission applied by FastAPI before pager. **Load more sales**without stating that a partial listing is complete.
- `GET /api/v1/businesses/{business_id}/sales/{sale_id}`: historical voucher with lines, prices and means of payment **declared**, discounts and balances after sale if there were goods.
- `GET /api/v1/businesses/{business_id}/sales/by-request/{request_id}`: explicit consultation of voucher by **clave UUID4 original**, does not create sale or repeat POST. A 404 does not imply that the original POST never occurred.
- Errors of 401, 403, 404 and network are displayed without inventing DEMO data. If session expires, it returns to login without storing Bearer.
- The transaction that created the sale may have been done earlier with FastAPI, but **this screen never confirms sales, changes stock, opens box or credits Market Payment**.

## Design and integration

`frontend/src/features/sales/RealSalesPage.tsx` presents company information, headquarters filter, sales summary, detailed proof and search by request. Responsive styles isolated in `frontend/src/features/auth/auth.css`. The route was added to `RealAuthApp` and the entry card in `RealBusinessesPage`. The reading and validation of payloads are in `realSalesReadGateway.ts` and his Node tests on `tests/sales-real-read-api.test.mjs`.

**Access matrix approved T09-B:** ENTRY_AMINISTRATIVE/ADMINISTRATOR read all tenant sales; CHARGE/TRAWER only from offices with an active assignment; sales without a head office only for holder/admin; roles or memberships not read. **does not decide or replace permits**: FastAPI also restricts direct UUID and `request_id`.

## Planned automatic testing

1. **Node T09-D:** list with Bearer and header filter only via GET; parser of abstracts, limits and duplicates; key recovery, valid tenant proof and incompatible response; no POST calls.
2. **Build y Oxlint:** `npm.cmd run build`, `npm.cmd run lint` y `node --test tests/*.test.mjs`. The IC also validates PostgreSQL backend, Playwright Real inventory and DEMO regression.
3. **Playwright T09-D REAL:** con `PYME_DISPOSABLE_QA=1` only, create ephemeral fixtures in IC PostgreSQL; opens the history of two locations, filters, consults a voucher and retrieves it by `request_id`; verifies **zero POST to sales from interface**. Second case in mobile viewport and after F5/login. Do not run against local databases with user data.
4. **Backend T09-C (already validated):** 886 PostgreSQL tests with role/headquarters matrix, revocation, SQL filters and pagination; they are repeated as regression in this increment.

**Evidence of CI (Adopted):** integral run #42907187715, commit code/documentation `b60c1969d58a0d18e3c91cb34d40680208c359f3`, **SUCCESS**: PostgreSQL **886/886** (2 warnings de Pytest, no bloqueantes), frontend **272/272**, build y lint limpios, Playwright **7/7 REAL** (including three T09-D reading/recovery scenarios and four inventory scenarios), **6/6 DEMO**. Independent backend #42907187818 passed in Python 3.12 and 3.14 with Docker/liveness. Frontend #42907187572 passed frontend and Chromium DEMO. **Technical result T09-D: approved in IC; manual acceptance of the empty state and connection with REAL API approved on 10/11/2026; vouchers with data and actions not locally verifiable without sales.**

## Manual QA guide NOT MUTANT (to be run on local frontend)

1. Without generating new sales, check that the button is visible **REAL sales history · consultation** in the details of REAL company. Do not navigate to DEMO.
2. Open History. Verify Company Name, Role, Warning **Read only** and filter headquarters. If the company still has no sales, wait **No sales accessible...**: **is not a fault**.
3. If there are historical sales already existing from that company, choose a headquarters and open **See voucher**. Validate amount, article/service snapshots, discounts, declared payment method and no external accreditation is promised.
4. If available `request_id` **pre-existing and authorized**If you don't keep one, **not create a sale to get it** in this block.
5. Check the browser network, if checked, that the sales routes used by this module are **GET**, without POST or stock changes.
6. Check back to company, F5 and login. On mobile, check that cards do not uncheck the screen and that the sales interface remains read only.
7. Record captures and results in this record; differentiate local interface observations from automated results. The voucher trail is only manually executable if visible sales exist.

## Known risks and limits

- Filters by location are applied in FastAPI; the list of location names may include locations not assigned to the operator. Selecting them will return an empty listing, without allowing viewing of other people's sales.
- The pagination `offset/limit` you can scroll if sales are recorded while the user page. If a duplicate ID appears between pages, the frontend offers to restart the query; there is no stable cursor/snapshot.
- The display does not show cash balance or bank/MP integration. Payments are **declarations**. Amounts use whole cents received from the server, without recalculating sales against current prices.
- T09-E will add proof of sales recovery with **Lost and key Post response persisted**; T09-D offers only the query and the reading smoke.


## Manual Act T09-D — Empty actual consultation (10/11/2026)

**Source:** user-shared capture after syncing frontend to commit `994569e`, rebuild the FastAPI Docker service from branch T09, check all three endpoints `/sales`, `/sales/by-request/{request_id}` y `/sales/{sale_id}` in OpenAPI of port 18000 and configure Vite with proxy `PYME_API_PROXY_TARGET=http://127.0.0.1:18000`PostgreSQL container was still `healthy`. The first previous capture displayed an HTTP error when viewing the listing due to outdated Docker backend; the second attempt no longer shows it.

| Control observed at final catch | Evidence | Outcome |
|---|---|---|
| Company context | Title **Sales history**, **TEST Company A**, rol **ADMINISTRATIVE SHIPPING** | **Visually adopted** |
| Read-only contract | Legend: ‘No sales, no stock change or payment is recorded here’ | **Visually adopted**: IU does not offer to create sales |
| Checklist | «**0 loaded · End of list consulted**», without red alert and message "No sales accessible with the filter chosen" | **APPROVED**: API responds empty list with current filter |
| Headquarters selection | Control ‘All authorised locations’ available | **Available**, unexecuted/documented filter change in this capture |
| Recovery on request | UUID4 field and request check button present | **Available**, sin `request_id` pre-existing manual test |
| Check with amounts/payments | No sales were accessible in the account during observation | **Not manually executable with this evidence**; validado en Playwright REAL aislado |
| No HTTP mutation | There is no evidence of browser network capture in this round | **Not manually stated**; probado con Playwright REAL, verificando cero POST desde UI |
| Mobile experience and pagination | Not shown in desktop capture with empty result | **Not manually tested**; Chromium REAL mobile and IC-backed pagination tests |

**Conclusion of the round:** local frontend integration → FastAPI T09-C and empty history status remain **manually approved**. The empty state does not imply error nor shows that sales were never recorded in other tenants or headquarters. No sale was created nor any inventory altered to produce evidence. **manual acceptance of T09-D is partial and sufficient for the case available**; the proofs and recovery trail already has evidence of Playwright disposable but not a visible local historical sale.

**General status:** T09-D with CI **Adopted** and empty local smoke **APPROVED**; T09-E and T09-F still **outstanding**PR #42 continues draft, not merged.

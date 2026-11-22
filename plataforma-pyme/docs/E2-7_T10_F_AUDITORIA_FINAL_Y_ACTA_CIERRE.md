# E2-7 · T10-F — Final Audit and Technical Closure Act of the REAL POS

**Date:** 11/11/2026. **Exclusive branch:** `feature/e2-7-t10-pos-ventas-real`. **PR:** #43, **pending merit in updating this record**.

> **Status of this act: QA documented manual and technical closure; IC of the last outstanding documentary change.** The responsible expressly authorized the merger of PR if final verifications are still approved. **no** authorizes the deployment or enable REAL POST in a persistent company.

## 1. Audited scope and boundaries

T10-0, T10-A, T10-B1/B2 (command, validation, journal by actor/tenant and coordinator), P01 (prices and RBAC in FastAPI), T10-C (headquarters, catalog, cart and subtotals), T10-D (declared payments, consent, Impotent POST and GET recovery) and T10-E (integrated tests) were also inspected. `SaleService`, reading contracts, QA browser, CI and local UX.

**Scope expressly excluded:** bank accreditation, real-time payment of Market Payment, webhook, QR collection, bank reconciliation, final design DEMO, stock shown in real time within the POS tab, and authorization for commercial allotment. `MERCADO_PAGO_DECLARADO` records what the seller declares, **does not prove that there was a payment**.

## 2. Findings, corrections and decision

| Finding | Severity | Action/conclusion |
|---|---|---|
| Playwright T10-C esperaba pago previo `3501,00` after editing 2→3 units; the IU correctly indicated `5301,50` | Test failure | Corrected `c6252282`; aggregate final review test, IC later approved |
| Lack of browser case two payments, exceptional price and discount | Coverage | Incorporated `49cc8c73`/`ef7b223a`, check `SaleView` individual, IC later approved |
| Lack of verification of GET 404 after POST really lost | Coverage | Incorporated `66ac8470`: manual forwarding with **misma clave y body**, a final sale, IC approved |
| Lack of check physical stock browser/ledger | Coverage | Incorporated `71a1e486`: stock 5→3, version 1→2, one movement `VENTA_SALIDA=-2` and voucher |
| Lack of browser check `409` sin stock | Coverage | Incorporated `a0f96845`: 409, recoverable slope after F5, GET 404, without automatic POST or sale |
| `try/catch` that only re-launched error | Lint | Simplified in `73d683b7`; retains errors and journal, without changing transport |
| `setState` synchronous in `useEffect` for single payment | Lint/UX | En `561928fe` the initial payment is **derived from cart total** during editing and freezes only when manually modified; respects lock during review |

**Scope findings, no bugs confirmed:** P01 must remain mandatory in FastAPI even if the browser hides fields; price/headquarters of the cart may become obsolete until POST and are revalidated in backend; IndexedDB saves **commercial data not encrypted** (without token) and is not intended for shared devices. Uncertain attempts are not automatically removed or replaced by another key.

## 3. Revised invariants

1. **Insulation:** actor + company + `sale.create`; a foreign proof, change of actor/tenant or corrupt journal does not allow to eliminate a different attempt.
2. **Idempotency:** UUID4 + immutable canonical body saved and rereaded before the first POST; there is no automatic retry when mounting/F5/401/403/409/422, nor after response or uncertain network. GET 404 does not show that a sale was not registered. Replay allowed only by explicit action on the same request.
3. **RBAC/P01:** holder/manager can quote and discount, maintainer/worker only catalog price and assigned headquarters; FastAPI denies bypass. Without headquarters, only services by managerial roles.
4. **Monetary accuracy:** millionths, whole cent prices, subtotal per line with HALF_UP, discount and exact sum of 1–6 payments declared; do not use floats or interpret payments as accredited.
5. **Stock/atomicity:** physical sale requires sales and with storage, sufficient stock and debit `UPDATE` Conditioned; voucher, ledger, balance and payment are confirmed in a single transaction; rejection 409 reverses deeds.
6. **Safe deployment:** `VITE_PYME_ENABLE_REAL_SALES` default off outside the disposable runner. This variable **is not backend security**: only avoids accidental action from the local IU.

## 4. Evidence

- **Local user QA:** 53/53 tests T10-A/B1/B2/C/D Node, TypeScript/Vite build correct, lint initially 0 errors + 2 warnings.
- **Visual user QA:** final review of `TEST Empresa A`, sede `Sede A TEST`; product 31,5004,500, service 41,0004,000, subtotal $8,500, discount $2,000 and total/payment declared $6,500. Check box enabled with **Real confirmation button disabled**. Checked **no sales record**.
- **IC of the last T10-E increase before T10-F:** commit `a0f96845`, frontend #42980722941, backend #42980723006 y full-stack #42980722949: **SUCCESS**.
- **CI T10-F verified before this documentary addition:** commit `8649e007`, frontend #42982177656, backend #42982177742 y full-stack #42982177673: **SUCCESS**This QA manual annex is a new documentary commit; also verify the IC corresponding to the final HEAD, without attributing to it results of `8649e007`.
- **Existing API backend tests:** `test_sales_api_integration.py` (physical/mixed sale, replay, leadger, insufficient stock rollback, headquarters), `test_sales_price_policy_integration.py` (four roles, prices, discounts, locations and bypass) Coverage does not amount to a permit to operate in the TEST company.

## 4.1. Manual use protocol executed by the responsible person (TEST Company A)

**Character of the evidence:** observation of the interface and commands executed locally; **is not a sale made**, nor does it amount to a manual execution of the POST sales in `TEST Empresa A`. User provided console log and checkout capture the **11/11/2026**.

| Use Control | Procedure/evidence | Outcome |
|---|---|---|
| Branch synchronization | `git pull --ff-only origin feature/e2-7-t10-pos-ventas-real` y `git log -1 --oneline` | Fast-forward a `4c0cd1d` at the first local verification; subsequent E/F improvements were validated in GitHub Actions |
| Cart and subtotals | `npm.cmd run test:sales-real-pos` | **10/10** Node approved; whole/fractional quantities, price freeze, subtotal per product and update of same line |
| Checkout composition | `npm.cmd run test:sales-real-checkout` | **8/8** Node approved; total, discounts, five declared methods and exact sum |
| Writing attempts | `npm.cmd run test:sales-real-write` | **12/12** Node approved; durable reserve, uncertain HTTP, replay, GET 404 and proof check |
| Journal local | `npm.cmd run test:sales-real-pending` | **12/12** Approved Node; F5, actor/company isolation, corruption and IndexedDB error |
| Command contract | `npm.cmd run test:sales-real-command` | **11/11** Approved node; HALF_UP, payments, limits and canonical format |
| Compilation | `npm.cmd run build` | TypeScript + Vite approved; Bundle warning >500 kB **non-blocker**; Deferred load optimization |
| Initial Lint | `npm.cmd run lint` | **0 errors and 2 warnings** (`no-useless-catch`, `set-state-in-effect`); both corrected later on T10-F |
| Manual checkout, reading | Company `TEST Empresa A`, sede `Sede A TEST` | Final review shows company, headquarters, lines, subtotal, discount and half declared |
| Example amount | Product A TEST **3 × $1.500 = $4.500**; Service A TEST **4 × $1.000 = $4.000**; discount **$2.000** | Subtotal **$8.500**; total **$6.500** |
| Payment method | `Mercado Pago (solo declarado)`amount **$6.500** | It matches the total; **no** involves accreditation or transfer |
| Consent and writing control | Marked confirmation box, visible validation message and button `Confirmar y registrar venta REAL` disabled | **No POST sent** since this local review; no stock was discounted and no proof was created |
| Additional regression in IC | Ejecuciones Playwright REAL/DEMO y backend sobre PostgreSQL descartable | Validations of physical stock, mixed payments, recovery GET, 201 lost and 409; specific results linked to the SHAs cited in the minutes |

**Scope limit:** manual evidence does not include accredited bank payment, persistent sale at TEST Company A, actual resumption of a slope on the user's team or validation of production environment. POS writing tests were performed by automated browser against PostgreSQL **disposable** and with QA credentials isolated.

## 5. Residual risks and non-T10 decisions

- **Commercial Enabling:** Separate pending decision, deployment controls, backups and monitoring. Do not change the environment variable in TEST Company A or run trial sales on a persistent basis.
- **Operational interface:** the locations can be displayed as options before FastAPI checks individual assignment; an operator does not get permission to choose it. It is appropriate to improve filtering/feedback when there is an API of authorized sites; do not assume frontend permissions.
- **Shared devices:** The indexedDB journal may contain quantities, notes and unencrypted references. Define job policy and secure closing of earrings before production.
- **T10-E tests already performed:** stock, service, mixed payments and recover 201/404/409. Even with green IC, tests do not replace operational monitoring under actual network or power failures.
- **Design and DEMO:** homolog aesthetics and navigation after integrating modules; without copying demo data to the REAL tenant.
- **Real payment market:** QR article, QR webhook collection and confirmation are later and separate tasks.

## 6. Door of closure and actions

- [x] Code audit, contracts and T10 tests.
- [x] QA manual **no destructiva**: final review and button locked.
- [x] CI E2-7/T10-E `a0f96845` aprobada en tres workflows.
- [x] Corrections of the two lint warnings incorporated into branch.
- [x] CI T10-F `8649e007`: tres workflows SUCCESS con ambas correcciones de lint.
- [ ] **HEAD CI final documentary** that incorporates the protocol of use: verify results of three workflows on that commit before merge.
- [x] Approval **express of the person responsible** to integrate PR #43 to `main` when your controls are green (11/11/2026); do not confuse with enabling POST outside the discardable environment.
- [ ] Confirming merge and leaving evidence of the SHA `main`.
- [ ] In separate proceedings, assess whether it is authorised **enable persistent sales**; the closure of T10 does not do so by itself.

**Opinion after manual revision:** T10 functionality audited, local non-destructive QA documented and CI T10-F `8649e007` Approved. **Authorized integration, subject only to the ICs of the last documentary commit**Poster empowerment on persistent basis **is not authorised**.

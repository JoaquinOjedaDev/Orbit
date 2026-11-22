# E2-5 — Invariant and technical area audit matrix

**Scope:** E2-5 A/B/C frozen in `748e69319d8d04900c009d5184168a264a9deeac`.  
**Character:** **independent audit plan**, NO list of confirmed defects. Each row requires evidence and opinion from the future reviewer.  
**Principle for AI:** implementation and the approved contract send out conceptual diagrams, external pseudocode and style preferences. AI must compare models, SQL, HTTP, dependencies and tests: do not infer properties from a single layer.

## 1. Limits of confidence and reference architecture

`Cliente (Swagger/React/externo) → FastAPI/Pydantic → autenticación Bearer opaca con sesión revocable → Business/Membership/LocationAssignment → Service + Session SQLAlchemy síncrona → ORM/SQL PostgreSQL 16 + constraints + commit → ledger y proyección`.

- `business_id` derived from the URL, but **does not grant permissions**; the server checks the belonging and resources in that tenant.
- `StockMovement` es la **Signed historical evidence** y `StockBalance` la **Current projection blockable**. A correction should not erase history or create a second editable balance.
- `InventoryOperation` is the idepotent header of a **article only** and class; `TRASLADO` requires two movements, each adjustment/initial **uno**.
- `PurchaseReceipt` and movements `COMPRA_RECEPCION` belong to E2-4 and must remain operational and legible.
- `money` In ARS cents only affects the purchasing/reception dependency. **No cash transaction, payment or sale** in a transfer/adjustment E2-5.
- Location locks and fixed order in transfers are part of the design; use of `expected_version` only in adjustments **is not by itself a bug**.
- Actual authentication: `app/modules/auth/tokens.py` genera tokens aleatorios URL-safe de 256 bits; no JWT. `SessionService` Check your fingerprint and status on DB.

## 2. Main matrix RF/CU, invariants and evidence sought

| ID | RF/CU | Invariant or policy examined | Primary source | Representative test | Critical Auditor Question |
|---|---|---|---|---|---|
| **INV-01** | RF-06 | Manual operating table, `kind` allowed, correct addresses and 3–500 motif | `models/inventory_operation.py`, migration 0016 | `test_inventory_operation_model.py` y `integration.py` | Can an invalid INSERT SQL (address, unit or motive) enter by semantics NULL or partial FK? |
| **INV-02** | RF-06 | FK composed of tenant for article, location and operating actor | ORM + DDL `e25a_inventory_ops` | `test_inventory_operation_integration.py` | Can a movement/leader associate with the UUID known to an outsider? |
| **INV-03** | RF-06 | XOR Origin: purchase movement O manual; sign/type matching | `models/stock_movement.py`, migration 0016 | `test_signed_origin_kind_is_enforced_in_postgres` | A row mix `receipt_id` con `inventory_operation_id` or contradicts `operation_kind`? |
| **INV-04** | RF-06 | Ledger compatible with E2-4 reception documents | `receipt_schemas.py`, `receipt_service.py`, `inventory_router.py` | `test_receipt_http_and_historical_movement_remain_unchanged` | Did historical data change or did the old receipt DTO change to new optional fields? |
| **INV-05** | CU-08 | Reading balances/movements by company, filters and pagination | `inventory_router.py`, `ReceiptService.list_*` | `test_transfer_movements_visible_in_general_ledger_and_old_receipt_unchanged` | Does the reading share auth/tenant? Does it correctly filter both ids and not add from another business? |
| **INV-06** | CU-09 | Transfer requires two different locations, active and STORE | `transfer_schemas.py`, `TransferService.transfer`, `locations/permissions.py` | `test_location_status_store_and_foreign_tenant` | Is it possible to use SELL-only or its own place without STORE? When is it blocked and revalidated? |
| **INV-07** | CU-09 | Sufficient origin, conditional SQL debit; UPSERT destination; total retained | `transfer_service.py`, `stock_balance.py` | `test_transfer_atomic_two_movements_same_total_and_replay` | Can there be credit without debit, negative or double confirmation? |
| **INV-08** | CU-09 | Stable lock order for two locations and deadlock/reintense | `transfer_service.py`, `test_transfer_concurrency_integration.py` | `test_opposite_direction_transfers_lock_locations_in_stable_order` | What happens to opposite transfers and transactions using another order (reception/adjustment)? |
| **INV-09** | CU-09 | Exact replay of the same actor/body/tenant returns 200 without mutation | `TransferService._replay`, UNIQUE `business_id,request_id` | `test_concurrent_replay_same_key_does_not_duplicate_stock` | Can new key, same different load key, actor or type cause duplication or sensitive information? |
| **INV-10** | CU-11 | `STOCK_INICIAL` once per company/location/article, including zero historical balance | `adjustment_service.py` | `test_initial_is_forbidden_after_receipt_or_previous_initial_even_when_empty` | Can you re-start after moving the entire stock? What if there is a leader without balance? |
| **INV-11** | CU-11 | Only holder/admin initializes; assigned CHARGE can adjust; WORKER does not | `adjustment_service.py`, `locations/permissions.py` | `test_permissions_employee_and_manager_location_assignment` | Are restrictions on POST, GET, replay, changed role or revoked membership applied? |
| **INV-12** | CU-11 | Adjustment requires pre-balance and accurate version, +1 per success | `adjustment_service.py`, `stock_balance.py` | `test_no_prior_balance_cannot_be_adjusted_without_stock_initial` / `test_insufficient_stock_and_stale_version_do_not_change_ledger` | Does the same balance read support a second old version writing? 409 consistent returns? |
| **INV-13** | CU-11 | Positive/negative adjustment signed; not exceeding zero/maximum | `adjustment_service.py`, `MAX_BALANCE_MILLI` | `test_adjust_increase_decrease_and_history_are_signed` | Is there overflow, unmapped SQL 500 error or incorrect sign under extreme charge? |
| **INV-14** | CU-11 | Replay and collision type/actor/body in adjustments | `AdjustmentService._replay` y request digest | `test_adjustment_key_cannot_be_reused_after_transfer` | Can a UUID4 used in moving be reused for initial? What effect does a race have? |
| **INV-15** | RF-06/RF-05 | Uncredited purchase; once credited receipt; no change in adjustment/transfer | `receipt_service.py`, `receipt_schemas.py`, `transfer_service.py` | `test_receipt_api_integration.py` | Is there accidental E2-4 behavior when operating E2-5? |
| **INV-16** | RF-06 | A comprehensive commit/rollback for header, two movements and balance sheets | `transfer_service.py`, `adjustment_service.py` | partial error tests; review their completeness | Does a default between debit/credit/insert leave persistent effects? Was 500 unexpected spread? |
| **INV-17** | Security | Revocable session and revalidated membership/company; hidden resources | `auth/session_service.py`, `purchases/service.py`, `businesses/repository.py` | `test_transfer_denied_on_invalid_token_and_foreign_operation` y tests de ajuste | Is there any way left unvalidated, especially GET of vouchers or early replay? |
| **INV-18** | RF-06 | Amount in thousandths, discrete units, `StrictInt` and limits of `BIGINT` | `*_schemas.py`, CHECK at 0016, `StockBalance` | `test_schema_rejects_discrete_fraction_bad_reason_boolean_or_extra` | Are booleans, fractions, invalid units and extreme values filtered without silent coercion? |
| **INV-19** | RF-06 | Leader consistency ↔ balance under mixed attendance | `receipt_service.py`, `transfer_service.py`, `adjustment_service.py` | **Unsubstantiated cross-specific coverage** | Is a simultaneous reception to initial or simultaneous incoming transfer to adjustment always serialized without double counting? |
| **INV-20** | DB security | Leader integrity to UPDATE/DELETE SQL direct; minimum privilege | esquema 0016, roles DB/Compose, ausencia de endpoint REST mutador | **Not tested on closure** | What SQL role does runtime use? Can you modify history and how to audit it? |
| **INV-21** | Safety/operation | Use of DB isolated tests and limited cleaning to tenant | `test_*_concurrency_integration.py`, receiving fixes | PostgreSQL 16 ephemeral CI; shared local development | Does any fixture erase more than your tenant? config accidentally allows you to touch real base? |
| **INV-22** | UX/DX | Status of error and consistent retrying contracts | routers E2-5, OpenAPI, Pydantic | HTTP/Swagger tests | Can the client application distinguish cause of 409 without parsing free text? Register as risk, not change API without decision |
| **INV-23** | Architecture | New patterns/abstractions only when they eliminate real problems | routers → services → modelos | static review and tests | Would you introduce another editable store, hidden commit, AsyncSession or duplicate interfaces? |
| **INV-24** | Documentation | RF-06, CU-08/09/11, UML 03B AS-IS/TO-BE, CI/QA attributed well | 01–05, ADR-004, documents E2-5 and closure | documented manual matrix | Is real backend attributed to frontend DEMO, is 840 interpreted as total coverage or does SHAs mix? |

## 3. RBAC matrix to be tested against APIs and policies

| Operation | Holder/Admin with active membership | Active and assigned manager | Active and assigned worker | Additional restrictions |
|---|---|---|---|---|
| POST transfer | Allowed at both STORE locations | Allowed **only if assigned to both** | Allowed **only if assigned to both** | Active company and locations, active physical catalog, sufficient balance |
| POST stock inicial | Allowed | **Prohibited** | **Prohibited** | No balance or previous movement in the pair, version 0 |
| POST adjustment in/out | Allowed | Allowed **only assigned to that headquarters** | **Prohibited** | Existing balance and current version, no negative |
| GET saldos/ledger | Active business membership | According to reading policy, check `ReceiptService` | According to reading policy, check `ReceiptService` | Filter per tenant; not suppose STORE permissions for being authenticated |
| GET transfer/adjustment voucher | Active business membership | Verify exact permission and current conditions | Verify exact permission and current conditions | Investigating whether VIEW is enough or requiring operation; not inventing policy |

Ensure that role/assignment/business changes and historical re-attempts are checked **after** The reading behavior can be deliberately broader than writing: the audit must contrast it with the business rule, not raise a 200 reading to default vulnerability.

## 4. SQL model and counterexamples to be inspected by the second AI

Check from PostgreSQL 16 and SQLAlchemy:
- `inventory_operations`: direction restriction by `kind`; `business_id`/`id`/`kind` and FK composed of the leader; uniqueness of request per tenant; member actor of the same business; motive and units.
- `stock_movements`: `COMPRA_RECEPCION` use receipt+line and positive delta; `TRASLADO_*` uses header `TRASLADO`; `AJUSTE_*` y `STOCK_INICIAL` No movement with both origins or with undetermined origin.
- `stock_balances`: triple key; non-negative quantity, maximum limit, positive and progressive version through services.
- **SQL limit that should NOT be hidden:** CHECK/FK does not by itself guarantee that the magnitude/location of each manual movement matches all attributes of its header, nor that an operation has exactly two events; **service and testing** They support these guarantees. Audit if there is an alternative path with DML privileges that breaks the contract and how to limit it.
- **Idempotency:** the print is calculated with JSON normalized and ordered; UUID4 key is not a secret but its real QA value is not published. `actor`, `kind`, `digest`, `business_id`, turnout and collisions.
- **Do not delete/edit previous migrations:** to harden the scheme, new compatible migrations and logical rollback plan that respects existing records.

## 5. Expected results matrix (not making audit a formality)

| Case | Expected current result | What to observe |
|---|---|---|
| New transfer 4 out of 10 | `201` | Source 6, destination 4, two net events 0 |
| Replay exact transfer | `200` | Same header and same ids; no new event |
| Transfer 7 from balance 6 | `409` | No partial mutation |
| Initial new torque | `201` | Version 1, Positive event |
| Replay exacto inicial | `200` | Recover original header without new row |
| Initial second with new key | `409` | History intact even if it reaches zero |
| Adjustment +2 over v1 | `201` | Balance 7, version 2 |
| Adjustment -1 over v2 | `201` | Balance 6, version 3 |
| Output 7 from balance 6 | `409` | No new movement |
| Adjust with v1 after v3 | `409` | No change of balance or leadger |
| Any other tenant's appeal | `404` or refusal under the contract | No data leak or cross-write |
| Invalid/revocated meeting | `401` | No commercial effects |
| Invalid Pydantic data | `422` | No effect; do not accept decimal/boolean as quantity |
| Unauthorised access | `403` in own enterprise | Do not confuse with 404 of foreign tenant |

## 6. Risks to review without converting them into automatic implementations

**In audit scope:** race mix transfers/adjustments/receptions, permissions during retry and revocation, direct SQL of the ledger/roles DB, isolation of fixture test, saturation/error, discrepancy between docs, schema, contracts and rules.

**Outside the development of E2-5:** reserves/sales `RF-07`, multicurrency, partial reception, new general rounding, typified reason/approvals and related reversal (reciprocal decisions). **They can be recommended**but NOT introduce without authorisation and compatibility assessment.

**Outcome required of the auditor:** for each INV-xx, register `INSPECCIONADO + evidencia`, `NO INSPECCIONADO + motivo` o `NECESITA TEST`No one. `OK` global without nuance missing verifications.

# E3-2B — ADR, proposed contracts and acceptance matrix

**Type:** revised initial proposal, derived from the status of `main` and the HTML provided. It does not state implemented endpoints.

## ADR-01 — Separate collection and sale intention

**Context:** `Sale.status` only admits `CONFIRMADA` y `SaleService` records sales, lines, payments, stock and inventory movements in a single commit. Create the sale by generating QR would deduct stock without payment.  
**Decision:** QR intention as a separate resource; created without `Sale` and without moving stock. It is registered single sale after authorization of the backend. If the subsequent confirmation fails by stock, it enters `REQUIERE_REVISION` For compensation, never be counted stock fictitiously. Evaluate temporary reserve with transactional ledger in B4.  
**Test:** Get sales and ledger empty after QR; one move at the end.

## ADR-02 — Fictifical linkage

**Context:** connecting third party accounts in production requires OAuth consent, encrypted tokens and renewal.  
**Decision:** B1 uses a MOCK provider, save `business_id` and DEMO metadata, non-keys, tokens, passwords or fake CVU validated as real. Always display DEMO brand in accounts and collections. Adapter backend replaceable for B6.  
**Test:** two companies do not share a link; operator without permission does not modify it; there are no MP secrets in log/front.

## ADR-03 — QR and commercial detail

**Decision:** in B2 the QR shows next to a snapshot table for user and client: photo/name, quantity, unit, subtotal, discount and total. **no** is processable by Market Payment. In B6 send `items[]` y `description` to the Orders API when they are admitted; not depend on the wallet rendering each product.  
**Test:** Subsequent changes in catalogue/prices do not alter the amount or lines of intent; F5 retains the detail.

## ADR-04 — Origin and payment statements

**Decision:** origin `MOCK_QA` vs `MP_API` and state separated from the status of sale. `APROBADA_DEMO` does not amount to credited balance. Keep history of unchangeable events and unique keys by attempt. The server determines valid transitions and actor authorization.  
**Test:** 2 approvals → 1 effective event and 1 sale; expiration and late payment do not credit or deduct stock automatically.

## ADR-05 — Layer and Environment Safety

**Decision:** backend policy to connect/disconnect (title/admin with permission), collect (rol with SELL permission and enabled headquarters), simulation (exclusively QA/manager role with QA flag and explicit QA base). Fail closed, active session, active company, no token in URLs, no trust `role` o `status` Keep the existing REAL sales gate for other methods until your own authorization.
**Test:** 401/403/404/409 according to cause, QR is not filtered or amount of another business, account suspended does not create attempts, without feature flag mock cannot approve.

## ADR-06 — Compatibility, evolution and scope

**Decision:** not touching `Sale` ni `SalePayment` with states `PENDIENTE` to break your existing CHECK. Keep sales declared by current route; add QR integration as an authorized orchestrator that eventually produces a `SaleCommand` Standardized. Do not confuse QR from article with QR from collection. Do not yet implement general accounting book.

## QA matrix per block

| Scenario | Block | Minimum check |
|---|---|---|
| Connect DEMO A account, recharge, disconnect, reconnect | B1 | Persistent state, idempotency, no external credentials |
| Worker/seller only query | B1 | Visual occultation + 403 backend for mutation |
| Company account A not visible in B | B1–B5 | Routes and bytes isolated by tenant |
| Attempted without account/company suspended/headquarters without SELL | B2 | Error, zero attempts |
| Two clicks on Generate QR | B2 | One single intention for the same key |
| QR shows 2 products + 1 service, discount, photo, ARS | B2 | Server totals; complete detail at 390 px and desktop |
| Later change of price or photo from the catalogue | B2 | Snapshot and collection amount do not change; current photo is only decorative |
| F5, logout/login, navigate and retake try | B2–B4 | GET recovers the attempt without reissued QR or charging |
| Approved/rejected/expired/cancelled | B3 | Authorized transitions and auditable events |
| Loss of response and retry, order of arrival reversed | B3–B4 | Recoverable state, no new sale or debit |
| Stock changed between QR and payment | B4 | No negative balance; revision/documented compensation |
| Service sold by QR | B4 | Inventory-free sales |
| Physical property sold by QR | B4 | A sale and a single stock leader |
| Approved payment and DB error when registering sale | B4 | REQUIRE_REVISION, Don't Pretend Final Proof |
| QR DEMO never appears as bank accreditation | B1–B5 | DEMO mark in status, proof and history |
| Keyboard, mobile screen, drop connection, accessibility | B5 | Navigation and readable statuses |
| Pytest, Alembic check, OpenAPI, Playwright REAL/DEMO y CI | B1–B5 | All green in SHA of each delivery; PR without automatic merge |

## Incremental execution guide

Each block is implemented in commits consistent with tests and documentation. Before moving on to another block: validate the three existing workflows, explain manual controls in Windows/PowerShell and maintain `main` The PR remains DRAFT until comprehensive approval. Do not use real secrets or execute payments with real money.

**Proposal for first human test (B1):** Open company A → link Market Payment DEMO → F5 → view account; switch to B → do not see A; enter as a worker → consult, do not modify; return as holder → disconnect/reconnect. No purchase, sale or balance is created in B1.

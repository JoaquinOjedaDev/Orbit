# ADR-006 — Sale, reported payments and QR collection
**Date:** 2026-11-06  
**Status:** PROPOSED for DEMO; real integration MP DIFFERENT to post API stage.  
**Responsible for approval:** TP team/functional manager (to be designated).  
**Sources:** E0-A Z074/Z075, H09/H10, D07/D08; E0-B `8.4–8.5; plan v4 `3 and document `03_MERCADO_PAGO_QR(1).md`.

## Context
POS Z074 proposes two-step checkout and Z075 has multiple payment logic not fully exposed. There is no accredited Market Payment integration in the demo. QR tab and QR collection are different functions.

## Proposed decision
1. Sale `Sale` contains validated lines and discounts per server in production; in DEMO gateway recalculates total, it never takes as authority a total arbitrary IU.
2. Applications `PaymentApplication` de **one or more means** They are exactly the total to be paid in cents. Transactions are expressed in company currency; advances/credit/complex returns are extensions requiring later rule.
3. Sale of physical good valid existence and unaccount stock once; service does not require stock or storage location.
4. One payment **declared** is internal registration; it does not amount to external accreditation. Digital wallet can be shared and does not represent a day balance.
5. QR product tab, optional and future, opens tab/allows to start selection. **Not confirming or enforcing collection**.
6. DEMO collection QR starts from sale; businessId/saleId/amount associated intention, with states `PENDIENTE`, `SIMULADO_APROBADO` y `CANCELADO` clearly labelled **DEMO — does not move money**. Do not include buttons that appear to corroborate real MP.
7. Market Real payment after: each company connects **your own sales account** (OAuth managed in backend and protected credentials); branch/POS of that seller; Orders API with idempotence; webhook signed + consultation to the provider; reconciliation, expiration and reimbursement. **Creating QR or receiving webhook does not imply confirming payment**.
8. While actual QR is pending, propose stock reserve with expiry separate from the final output; handle late payment/expiration using ADR/validated contract before production.

## Alternatives
- QR fixed item as proof: discarded.
- One single global MP seller for several tenants: discarded.
- Mark paid because frontend pressed "I already paid": discarded.
- Debit definitive stock when issuing QR: discarded.

## Pending evidence
- **DEMO-MON-01 / QA-MON-01:** Discount + 2 media fit the penny; invalid formats rejected.
- **DEMO-MP-01:** UI indicates DEMO; QR pending is not added to actual collections.
- **QA-MP-01/02/03 (actual IPA):** same idempotency key, duplicate/out of order webhooks, and A seller never apply money to B.
- Transition of cancellation/expiration without double charge or double discount.

## Preconditions to real MP
Verify current official documentation and enable QR/OAuth/Orders for Argentine third parties and sales accounts. Do not share secrets in repository, chat or frontend.
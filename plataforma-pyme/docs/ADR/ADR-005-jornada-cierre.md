# ADR-005 — Closing day, arching and snapshots
**Date:** 2026-11-06  
**Status:** PROPOSAL; exception ‘unverified’ DIFFERED and disabled by default.  
**Responsible for approval:** TP team/functional manager (to be designated).  
**Sources:** E0-A Z092/Z093/Z075, H06/H07/H09/H13/H25/H26 and D05/D06; E0-B `8.4; v4 QA-JOR.

## Context
HTML Z093 provides a useful closing UX but `commitFinalClosure` delete the draft without leaving a verifiable snapshot. Z075/Z092 offer other summaries, with differences over uncounted closure. E0-C must set a conservative variant for E1 without quietly approving exceptions.

## Proposed decision
1. `CashSession` belongs to a company and, **where applicable**, location and cashier. Service companies without physical cash can operate without mandatory working hours.
2. Opening saves actor, instant and initial cash fund; do not confuse wallet/CBU with box.
3. During the day, recorded and applied movements have stable source/type/import and references; do not recalculate balance from screenshots.
4. Normal closure requires spotting, identifiable cut, expected, counted, difference, actor, date and motive when applying.
5. **Persistent snapshot immutable first** in the same logical change that marks the Closed session. Do not reopen, delete or overwrite evidence. Retrying with the same key does not generate second closure.
6. Stock/trade fair return movements are recorded by independent command. Close box **no** returns products or invents a decrease. Digital money is reconciled by day payments, not by total balance of a shared account.
7. Closure `sin verificar` is not shown as functional action in E1 except for subsequent approval of special permission, cause, alertness and differentiated status.

## Alternatives
- Close without arching and delete draft: rejected for E1 by H06.
- Automatically close and return goods: rejected by H25.
- Rewrite snapshot after closure: rejected for loss of auditability.

## Risks and mitigations
DEMO implementation is a transition in a single store; race sale/closure requires **real transaction/lock** in API. Exact amounts of pennies and strict parseo.

## Pending acceptance
- **DEMO-JOR-01 / QA-JOR-01:** snapshot retains actor, date, arching, expected, difference and detail after consulting history; double click does not duplicate.
- **QA-JOR-02 (backend):** concurrent sale to the court is included or rejected, never half.
- Close does not delete drafts without snapshot, no stock swap or wallet balance.

## Approval
Conservative variant suitable for implementing E1-C2 as **Proposed**, validable by E2E; define exceptions only with approval.
# E3-1 — Closing of code revision, UX and final integration

**Date:** 12/11/2026  
**Scope:** `plataforma-pyme/`, visual increments E3-1E1, E2, F1, G, H1, H2 and H3.  
**Source:** rama `feature/e3-1h3-guia-contextual-onboarding-real`, PR #63.  
**Destination:** `main` after integrating PR #55 → #57 → #58 → #59 → #60 → #62.  
**Approval:** Functional visual review declared by the user, including final enhancement of folding invitation. Approval does not amount to validating changes in schema or future functionalities.

## Verified decisions

| Area | Final decision |
| --- | --- |
| Navigation | Side menu with counterable desktop (memory-only), mobile drawer with Escape and focus control; retains accessible names. |
| Home | Initial progress calculated from actual queries to PostgreSQL. If a reading is missing, it is explicitly indicated without inventing records. |
| New company | High confirmed leads to `/real/empresas/:id/inicio`; result of uncertain creation continues to be protected by the policy of idempotency. |
| Locations / Equipment | Empty states and restrictions by explicit roles; administrative changes require deliberate action. |
| Invitations | Headed "Invite a Friend" folded by default and accessible by keyboard; alternating does not create invitations. The issue of the single-use code and acceptance maintain their original contracts. |
| Personal account | "Introduce invitation code" identifies navigation and the load screen. "Accept invitation" is reserved for explicit sending of valid code. Top bar and tests share title. |
| Catalogue of services | `SERVICIO` does not support physical stock; context message without modifying the validation of backend. |
| Inventory | The balance always comes from the REAL leader, with pagination, versions, permissions and prevention of uncertain re-attempts. |
| Shopping/Receptions | Independent screens and return without recording scriptures; amounts, units reconciliation, stock and receipts are preserved. |
| POS / Sales | Explicit review before sale, rules of means of payment such as declarations, idempotency and permits; does not simulate bank accreditation. |

## Quality controls

1. **Scope and Code Review** navigation, onboarding, invitations, catalog, inventory, purchases, sales, CSS responsible and associated tests.
2. **Comparison of branches:** before integrating, the approved chain was ahead of the `main` Reference and did not incorporate modifications of backend, schemas, Alembic or HTTP contracts. In each merge the expected SHA was used to avoid concurrent changes.
3. **CI per increment:** PR #55, #57, #58, #59, #60, #62 and #63 finished successfully in both workflows on their revised commitments.
4. **Complete final CI required:** after retargeting PR #63 a `main`, run both workflows on a new PR commit and demand `success` before the merge. `main` already includes the E3-1E1 to H2 chain.
5. **Functional safety tests:** ephemeral PostgreSQL routes are preserved for business isolation, permits, loss of response, F5, 409, versions, recovery, desktop/mobile navigation and unintentional POST absence.
6. No production tests, offensive security audits or access to the user's local PostgreSQL base are reported.

## Observations and exclusions

- **‘Fruit pack’**: to be compared `business_id` y `catalog_item_id` Service tab with the historical stock movement observed. The current backend logic rejects stock settings for `item_type != BIEN`. Do not modify records or affirm inconsistency until verifying identifiers.
- **Duplicate PR:** #56 corresponds to an unselected Purchase alternative; #61 to an unselected H2 alternative, whose full-stack CI failed. Both must be closed as **not integrated**, preserving his history and linking to #55 and #62 respectively.
- **Out of range E3 visual:** Real payment accreditation, QR Mercado Pago connection, bank accounts, new cash register, financial reports, product photos, general bulk optimization, new commercial functionality and migrations. These are future independent blocks.
- The authentication status is still in memory deliberately; re-input after F5 is a validated prototype decision and does not appear as a persistent session.
- Do not use credentials, productive data or PostgreSQL user to run writing E2E; suites require `PYME_DISPOSABLE_QA=1` and an ephemeral base.

## Expected outcome

The approved chain is fully in `main`, PR #63 finished in merge, parallel versions closed without including your changes and GitHub Actions green for the last commit tested. The user's local base is not modified by these remote operations.

If subsequent regressions occur, open an independent PR with minimal reproduction and testing, without rewriting the history of `main`.

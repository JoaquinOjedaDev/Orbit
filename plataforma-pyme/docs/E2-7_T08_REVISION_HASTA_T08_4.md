# E2-7 — T08 review and QA preparation T08-4

Date: 10/11/2026. Rama `feature/e2-7-t08-inventario-real`PR #41 remains draft, without merit.

## Basis and scope

Review initiated on `be93ce133bec9e2c3d671d39888739ce9d7a89d8` updated to `d417331ff6468acce89f90c27c311c435b82a8a7` After concurrent commitments. The next inventory block is **T08-4**It was not already implemented, nor was it doubled in development and the concurrent changes were not overwritten.

| Block | Revised code and contract | Outcome |
|---|---|---|
| T08-1 | GET per tenant/headquarter/article, balance parser, pagination, cancellation of readings and user/path mount | No identified lock; high volume slope |
| T08-2 | Explicit local filters, partial counts and traceability | No identified lock; pre-conserved manual acceptance |
| T08-3 | UUID4 durable per actor/company, immutable body, recovery without automatic POST, two linked movements; backend service with STORY in both locations and transaction | Main functional circuit accepted according to minutes; negative QA and pending controlled failures |
| T08-4 | Single initialization, version settings, delta-turned counting, differentiated permissions | Implemented; requires REAL manual QA |

## Defects detected and concurrent corrections verified

El run `42868554058` de `be93ce1` failed. The failure of `countedMilli`: double bars in a literal regex rejected valid quantities, including `0,000`. It was also detected that the form compared the final balance with the limit per command (999999999), blocking legitimate entries over large balances.

During the review they arrived `0af6e90` y `be848bd`which correct both defects, and `f57bbfd`The maximum balance is 999999999999000ths; the maximum adjustment delta remains 99999999999999. The revised final version contains both rules.

## Evidence and limits

- En `d417331`: `node --test plataforma-pyme/frontend/tests/*.test.mjs`, **256/256**, no faults or omitted. **26 REAL inventory, 14 transfers and 15 adjustments**. The total corresponds to all files, not just the selection of IC scripts.
- The locally validated equivalent correction passed build and lint. The concurrent final version is rechecked; consult the corresponding commit IC before closing.
- The user’s Real Browser was not executed here. Backend services and their permission, atomization, idempotency and continuance tests were read; this does not amount to performing integration tests.
- The captures and acceptance of 7 + 4 = 11 are historical evidence of the previous minutes, not a new query of balances made in this review.

## Next step

Run Checklist from `E2-7_T08_4_STOCK_INICIAL_AJUSTES_VERSIONADOS_QA.md` about a new article, with TEST holder Company A: starting stock 5, entry 2, final count 6; wait for balances/versions 5/v1, 7/v2, 6/v3 and three moves +5, +2, -1. Count equal to the balance should not send POST. Do not repeat operations on Product A TEST to recreate evidence.

Before global closure T08-5: negative STORE permissions, conflict by obsolete version, recovery/F5 and loss of response, more than 100 records, A/B isolation and final DEMO regression. Do not declare T08 integral approved or merge to main by frontend tests.

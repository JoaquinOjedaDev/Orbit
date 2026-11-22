# E2-6 — Express earrings and transition to E2-7

**Closing cut:** `main` `6336152e8dd095ca91363566beddd2b622432a5e` (PR #27 merged).  
**Purpose:** avoid that completing E2-6 involves silencing debt or expanding E2-7.

## 1. External audits by block

The E2-1, E2-2, E2-3, E2-4 and E2-5 sheets provide instructions or evidence of closure, but do not prove that the companion has completed all audits and corrections. `docs/E2-6_AUDITORIA_IA_*.md` es **protocol only**; there is no final independent E2-6 report in this closure.

Any correction identified by the partner must be born from a traceable finding and decision of the responsible. For subsequent integration: independent branch from real SHA of `main`, individual PR, tests that reproduce the failure, explicit compatibility review and final CI. Do not modify applied historical migrations or affect QA companies without need.

## 2. Functional risks that must remain visible

| Item | Scope or uncertainty |
|---|---|
| Historical Replay after Pausing Location | `SaleService` checks authorization/location fitness before replay. Validate historical response recovery policy. No failure confirmed only by potential scenario. |
| Cross-recurrence | More simultaneous PostgreSQL intervals between sales, receptions, transfers and adjustments can improve the order coverage of locks and deadlocks. |
| Permissions with simultaneous revocation | Justify specific assignment/role tests versus sales confirmation. |
| OpenAPI Contract | `SaleView.balances_after` it's like `list` generic; the specific response retains `catalog_item_id`, `quantity_milli`, `version`. |
| Price/Discount policy | Client reports `unit_price_cents`; catalog used for identity and snapshots. Define which roles can alter amounts in UI/API integration. |
| Payments | Declarations, not confirmations by external entities; no cash/accounts. |
| Returns | No cancellation, compensation or reimbursement is implemented in E2-6. |
| Stock y manufactura | A well-made sale does not reduce recipe inputs or stock reserves. |

Do not convert these uncertainties into confirmed findings without reproducible test or causality.

## 3. Cross-sectional documentation pending updating

- `plataforma-pyme/entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md` retains historical rows that indicate RF-05/RF-06/RF-07 as planned. When closing the E2-7 integration it should be updated with existing endpoints, tests and SHA.
- `plataforma-pyme/entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md` still mixes previous implementation states with the initial cut. Distinguish historical proposal and actual status without rewriting requirements arbitrarily.
- `plataforma-pyme/CHANGELOG.md` concentrates on E1 DEMO and does not incorporate all actual increases E2.
- The old headers of `E2-6_DOCUMENTACION_INTEGRAL.md` y `E2-6_E_ENTREGA_TECNICA_Y_VALIDACION.md` say ‘merge pending’, correctly for your writing date, but **are outnumbered** by the post-PR #27 closure.

## 4. Agreed plan and E2-7 limits

**E2-7 = Frontend/backend integration, comprehensive QA and academic closure.** It should not be renamed as "Expenditure and Box".

| Subtapa suggested | Verifiable definition |
|---|---|
| **A** | Invent React E1 DEMO versus real routes E2-1..E2-6; screen matrix → endpoint → dependencies → acceptance criteria, select integration limits |
| **B** | Gateway/API typed, real login/session, tenant selection, progressive server-backed view habilitation; do not migrate DEMO data quietly |
| **C** | Real Process E2E: account → company → location → catalog → supplier/buyer/reception → inventory → sale; insulate tenant and validate persistence |
| **D** | Automatic regression, security testing and permissions, Docker/CI, QA manual focused and compatibility between modules |
| **E** | API matrix and academic documentation 01–05, UML/ADRs where applicable, README/Changelog and final closure of TP |

**RF-08 expenditure/box, RF-09 financial accounts, RF-10 QR** are described as post-MVP in the slogan. Your DEMO screens can remain with visible notice; not present them as API operations or actual accreditation.

## 5. Conditions before declaring completed E2-7

1. Define which screens consume real data and which ones remain DEMO without confusion.
2. Test isolation by `business_id` both in backend and selector and frontend status.
3. Align UX permissions with real API authorization (true source backend).
4. Not representing payments `MERCADO_PAGO_DECLARADO` as accredited.
5. Verify that the actual flow of receipt and sale produces ledger and consistent balances.
6. Publish evidence in precise SHA, update academic documents and record external audits/corrections actually received.
7. Any new functional block beyond reach should be agreed separately.

**Decision:** Technical closure of E2-6 settled; development of E2-7 can be prepared without declaring the independent audits of E2-1 to E2-6 resolved.

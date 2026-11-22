# E2-7 · T11-D2 — REAL Guided Manual Test Act

**Date:** 11/11/2026 · **Rama:** `feature/e2-7-t11-qa-integral-hardening` · **PR:** #45 DRAFT.

## 1. Scope, environment and evidence criteria

Manual test carried out by the TP head in Firefox, with step-by-step assistance and shared captures during the session. **Captures were reviewed in conversation; they have not been added as files to the repository**. Do not confuse a visual capture with network inspection/SQL. Read and prepare operations were executed, without confirming sales, new purchases, receptions, stock movements or adjustments.

- Entorno local Windows/PowerShell; `Vite 8.3.6` en `localhost:5173`, API Docker `127.0.0.1:18000`, PostgreSQL 16 Docker `127.0.0.1:55432`. `/health` answered `ok` and both health services after finishing upgrade.
- Persistent basis for development **TEST Company A**; commercial proof of explicitly blocked writing. Sale REAL POS without `VITE_PYME_ENABLE_REAL_SALES=1`.
- Actors: administrative account holder and partner account `miguel` (`TRABAJADOR`) Lists of different companies were also inspected by actor and shared membership in TEST Empresa A.
- **Derogation from administrative writing:** during the investigation **revoked Michael's assignment to Headquarters A TEST 2**. The assignment remained as `NO ASIGNADO` In the subsequent verification, it is therefore not correct to say that *there was no change* in PostgreSQL; it did avoid confirming commercial and inventory transactions. Such assignment was not reinstated during the test.
- Result of each step: **visually approved**, **confirmed default**, o **limit/not tested**No absence of errors is said to have occurred on non-travelled routes.

## 2. Recording of 39 steps

| Paso(s) | Executed case and evidence observed | Opinion |
|---|---|---|
| 1–3 | Docker API/DB health; Vite loaded `/real/login`Firefox offered credentials saved by browser manager; they are not React DEMO data. | APPROVED |
| 4–5 | Login holder recovered active profile from API; owner list: TEST Company A, B, T06 Normal/Pending; worker saw TEST Company A and its own company. Different Memberships. | APPROVED (submission) |
| 6–8 | Detail TEST Company A ACTIVA/MIXTO/tender; 3 visible venues: Headquarters A TEST and 2 with SELL/STORE, Headquarters A TEST 3 principal without SELL; Miguel assigned to Headquarters A TEST. | APPROVED |
| 9–11 | Catalog: Product A TEST $1,500 cost $800; Product T08-4 CONTEO no price; Service A TEST $1,000 cost $500. Pre-filled and cancelled edition unsaved. | APPROVED (visual) |
| 12 | Supplier A T07 ASSETS visible in owner/worker; owner has administration, worker only query. Text `1 proveedores cargados` observed. | APPROVED + TEXT |
| 13–14 | 4 historical purchases ($2,500, $9,200, $13,500 and $4,000); reception buys $9,200 CONFIRMED at Headquarters A TEST, +5 Product A TEST, historical balance 11, service without physical movement. | APPROVED |
| 15–18 | Purchase Form: quantity 3 × cost $1,250 = $3,750; edit total $6,000 unit recalculates $2,000; close and update maintained 4 purchases without new purchase. Text `1 renglones` observed. | APPROVED + TEXT |
| 19–20 | Inventory: Product A TEST 7 (Heading A TEST, version 5) and 4 (Head A TEST 2, version 2); T08-4 CONTEO 6 (version 3). History of 10 moves: 7 inputs/3 outputs; sum per seat/article reconciles the 3 balances. | APPROVED (referred) |
| 21 | Traceability `TRASLADO` -3 Product A TEST, with movement IDs, operation, headquarters, article and responsible; matched entry +3 in visible destination in history. | APPROVED (presence of IDs) |
| 22–24 | POS owner: three articles; selector offers only SELL headquarters and `Sin sede (solo servicios)`, excludes principal without sale; Product A TEST price $1,500 blocked, subtotal 1 μ1,500 and 4 μ6,000; price exception available only to administrator. | APPROVED |
| 25–28 | Physical cart 41,500 and service 21,000; subtotal $8,000, discount $1,000, total $7,000; two payments declared $3,000 EFFECTIVE + $4,000 TRANSFER. Correct final review; confirm sale disabled in local environment by security flag. | APPROVED (preparation, NO confirmation) |
| 29 | Owner's history: 0 confirmed sales and recovery by `request_id`; the $7,000 preparation is not listed as a sale. | APPROVED (visual) |
| 30–32 | **DEFECT T11-D2-01:** Miguel could select Headquarters A TEST 2 in POS without active assignment. He persisted after administrative revocation, F5 and re-login; he also showed Headquarters A TEST correctly. | HIGH DEFECT |
| 33–35 | Miguel can add 1×Product A TEST to the cart, declare payment for $1,500, but do not apply discount or edit price; correct role message. Removed item and cart was empty. | APPROVED |
| 36–38 | **DEFECT T11-D2-02:** Transfer STORE offered as origin/destination unallocated locations and could show balance consulted. Not confirmed. General stock reading shows all headquarters; the company-enter consultation policy was preserved. Initial stock/adjustments: worker read only. Transfer closure left versions and balances 7/4/6. | HIGH DEFECT + defined reading |
| 39 | Logout de Miguel returned to `Iniciar sesión real`; the browser manager was able to autocomplete credentials, without React session active visible. | APPROVED |

**Limitations:** These manual checks do not prove F5 of a truly confirmed sale, API 403 of a manual sale, comprehensive mobile entry, or permission policy in all modules. Those aspects are supported by separate IC suites where applicable. Passwords were not shared and tokens are not documented.

## 3. Reworking and subsequent manual revalidation

T11-D2-01/02 findings corrected in T11-E by endpoint of own assignments and filters in React; technical evidence in `E2-7_T11_E_FIX_SEDES_ASIGNADAS_QA.md`.

After `git pull` al commit `dd8f7b9`, user rebuilt **only** the image of the service `api` by `docker compose --profile api up -d --no-deps --build api`, preserving PostgreSQL; verified `/health: ok` The first update of React's charge against previous FastAPI had shown 422 responses, resolved after rebuilding the container.

**Owner/worker challenge:**

1. **POS de Miguel:** the selector now offers only `Sede A TEST · ventas y stock`; `Sede A TEST 2` He's gone. **APPROVED** with manual capture.
2. **Transfer of Miguel:** origin offers only `Sede A TEST`, with only one authorized headquarters appears a clearing message and disabled confirmation; no transfer was sent. **APPROVED** with manual capture.
3. **Consultation inventory:** continues to show all the headquarters of the same company. **INTENTIONAL** for the MVP, subject to review reading policy at a future stage.
4. **Automated regression:** full-stack #43002093357, 892 Pytest / 32 REAL / 6 DEMO: PASS. Includes revocation + F5 + re-login and blocking options in POS/transfer.

## 4. Closing actions and remaining defects

| ID | Severity | Status |
|---|---|---|
| T11-D2-01 filtered from SELL headquarters | High | CORREGIDO, CI + manual retest PASS |
| T11-D2-02 filtered from STORE headquarters on transfers | High | CORREGIDO, CI + manual retest PASS |
| T11-D2-03 reading company-inventory whole | Policy decision | Permitted to MVP, not classified bug |
| T11-D2-TEXT-01 singular/plural suppliers | Low | Later corrected by branch |
| T11-D2-TEXT-02 singular/plural lines purchase | Low | Later corrected by branch |
| T11-D2-TEXT-03 reference T10-E expired on screen checkout | Low | Later corrected; keeps switch secure by environment |
| T11-D2-TEXT-04 old text on future T10-D in detail company | Low | For checking and correcting if the view is located, do not affirm resolved |

**Manual test closure:** **APPROVED WITH CORRECT HALLS** for documented tours. It does not represent a global approval of T11 or authorization to merge; it requires final audit and explicit human acceptance.

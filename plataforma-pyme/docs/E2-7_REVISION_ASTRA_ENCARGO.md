# E2-7 A — Critical review of the integration plan for Astra

**Status:** prepared, **not executed**.  
**Objective:** that a second AI criticizes the plan of E2-7 **before implementing code**without confusing design with auditing of previous blocks.  
**Project:** PyME Platform — TP Programming 2 UNSAM 2C2026; `plataforma-pyme/`.  
**Baseline used by documents:** `main` `9a7a66394daf5a96b18b9ce796a2fe9ec92a4068`, PR #28 closed; confirm actual SHA when initiating revision.  
**Proposed branch of documents:** `docs/e2-7a-plan-integracion`; the auditor must register real HEAD, which includes these documents.

## Text ready to deliver Astra

> I want you to act like **independent technical reviewer** the E2-7 plan of my multi-company/multi-rub SEM platform (not an exclusive system of WALOS). **Frontend React/TypeScript E1 integration with FastAPI/PostgreSQL E2-1..E2-6, QA comprehensive and academic closure**. It is not a new expense module, cash or Pay Market.
>
> Repository: https://github.com/JoaquinOjedaDev/Orbit  
> Exclusive Folder: `plataforma-pyme/`  
> Code base revised by plan: `main` SHA `9a7a66394daf5a96b18b9ce796a2fe9ec92a4068`  
> Rama del plan: `docs/e2-7a-plan-integracion`
>
> **Before judging, check real access to both folders `frontend/` y `backend/`, routers/schemes, relevant tests and the following complete documents:**
>
> 1. `docs/E2-7_PLAN_RECTOR_INTEGRACION_Y_CIERRE.md`
> 2. `docs/E2-7_MATRIZ_FRONTEND_BACKEND_Y_CONTRATOS.md`
> 3. `docs/E2-7_QA_CRITERIOS_ACEPTACION_Y_RIESGOS.md`
> 4. `docs/E2-6_DOCUMENTACION_INTEGRAL.md`
> 5. `docs/revisiones/E2-6_CIERRE/00_LEEME.md`
> 6. `entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md`, `02_CASOS_DE_USO.md`, `03_MODELO_DE_DOMINIO_Y_UML.md`, `04_ARQUITECTURA_Y_PATRONES.md`, `05_MATRIZ_API_Y_TRAZABILIDAD.md`.
>
> Check it out too. `frontend/src/App.tsx`, `frontend/src/data/demo/demoStore.ts`, `frontend/src/features/`, `frontend/package.json`, `frontend/vite.config.ts`, `backend/app/main.py`, `backend/app/api/v1/router.py` y los servicios/schemas de auth, businesses, locations, catalog, suppliers, purchases, inventory y sales.
>
> **Your mission is to evaluate the plan, not implement it.** Do not edit, delete, publish or merge files/branches, or open PR. Confirm SHA exact base and plan; if you cannot read the repo, declare the limitation and do not invent analysis.
>
> Main questions:
>
> - Does E2-7 A-E cover the minimum functions of TP and contracts E2-1..E2-6 without unduly extending MVP?
> - Does the REAL/DEMO design allow you to take advantage of all current UX without mixing data or falsifying persistence?
> - Are a simple HTTP client, memory session status and Vite proxy reasonable before adding libraries? What specific risks and alternatives exist?
> - How should authentication after F5 be treated if there is no refresh endpoint? Is an additional technical session decision needed?
> - Are there problems with RBAC, tenant leaks, idempotency, company change runs or double deeds between demoStore/API?
> - What specific discrepancies are there between UI DTOs and schemas/backend? Contrast real names and enum, extra prohibited fields and exact URLs.
> - Is it essential to create `GET /sales` paged to integrate the history screen or can you reduce the range academically correctly? What tests would that endpoint require?
> - How to treat IndexedDB photos, simulated invitations, day/account associated with sale, stock batch and QR without promising they are real?
> - Are sub-increment B0–B3, C1–C3, D and E well sorted? Would you change dependencies or size of PR?
> - What is missing in actual E2E tests, IC tests, token security, network tests and recovery of operations with uncertain results?
> - What updates to UML, TP3, requirements and traceability are mandatory and what are optional improvements?
>
> **For each observation, it shall record:** ID `ASTRA-E27-XXX`, priority (blocker/high/medium/low), class (plan defect, contract gap, plausible risk, optional improvement), file(s)/lines that support it, what actual consequence would have, alternative proposed, compatibility impact with E2-1..E2-6 and a specific acceptance criterion or test.
>
> **Do not automatically approve the plan because you have detailed documents.** Avoid redesigning the application or adding libraries, financial backends or unnecessary infrastructure without reproducible justification.
>
> Deliver these five separate Markdowns, without modifying the repository:
>
> - `ASTRA-E27-00_RESUMEN_Y_VEREDICTO.md`
> - `ASTRA-E27-01_MATRIZ_COBERTURA_Y_BRECHAS.md`
> - `ASTRA-E27-02_HALLAZGOS_PRIORIZADOS.md`
> - `ASTRA-E27-03_PLAN_REVISADO_PROPUESTO.md`
> - `ASTRA-E27-04_EVIDENCIA_ACCESOS_Y_LIMITES.md`
>
> The revised plan is **a proposal**I want to decide with the responsible which changes to accept, adjust, defer or reject; then I will update the documents and we will just start E2-7 B0.

## Checklist for the team that will receive the review

- [ ] Astra confirmed repository, SHA base, SHA plan and real access to React/Backend.
- [ ] He reported which documents and files he could not read.
- [ ] It contrasted at least auth/tenant, catalog, purchases/reception, inventory and sales with its actual routes.
- [ ] It explicitly questioned and resolved sessional, proxy, DEMO/REAL decisions and sales history.
- [ ] It separated potential risks of proven defects.
- [ ] He justified changes with impact/alternatives and tests, not with a taste of architecture.
- [ ] He handed over five files and left the final decision to the team.
- [ ] It did not edit or open PR or alter external data.

## Selective adoption matrix (fill after)

| ID Astra | Priority | Evidence | Recommendation | Team decision | Justification | Adjusted document/section |
|---|---|---|---|---|---|---|
| ASTRA-E27-001 | Pending | Pending | Pending | **Undecided** | — | — |

**Agreed sequence:** proposed plan → review Astra → selective decision → plan E2-7 A corrected → PR documentary → Technical B0. Do not mix the audit of E2-1..E2-6 that the companion carries with the strategic review of E2-7.

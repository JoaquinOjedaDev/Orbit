# E2-5 — Documentary package for review prior to final closure

**Project:** Orbit · Programming 2 (UNSAM, 2C2026)  
**Block:** E2-5 — Inventory · A-cuts (model), B-treads, C-tightening and initial stock)  
**Date of the documentary cut:** 9 November 2026  
**Documentary version:** 1.2 — **PUBLISHED IN `main` by PR #24**, SHA original closure `c66df2f8ddaa8179ca12e342bd3099348bc6b155`; independent audit not yet carried out  
**Repository:** https://github.com/JoaquinOjedaDev/Orbit  
**Area examined:** `plataforma-pyme/` · **rama:** `main`  
**Commit exacto de cierre funcional:** `748e69319d8d04900c009d5184168a264a9deeac`  
**Migration in force:** `e25a_inventory_ops`.

## Purpose and limits of this delivery

This directory contains the **documentary closure E2-5 published**, coming from the ZIP v1 and revised in front of the code and observations of another AI. It was incorporated to `main` The sheet and the independent audit package are also published and can be delivered to the reviewer. **The audit has not yet been carried out and the publication does not constitute production approval.**

### Contents

| File | What is it for? |
|---|---|
| `01_INFORME_CONSOLIDADO.md` | Technical opinion set out, objectives, results and position at closure |
| `02_BITACORA_SWAGGER_E2-5_B.md` | Manual proof of purchase, receipt, transfer, re-try and balances |
| `03_BITACORA_SWAGGER_E2-5_C.md` | Manual Initial Stock Testing, Adjustments, Errors and Reconciliation |
| `04_PRUEBAS_AUTOMATIZADAS_CI_Y_WINDOWS.md` | PR, SHA, runs, number of tests, local execution and inferable coverage |
| `05_ARQUITECTURA_MODELO_Y_API.md` | Model of data, routes, controls and limits of transactions |
| `06_MATRIZ_TRAZABILIDAD.md` | RF/CU → code → tests → acceptance criteria |
| `07_FICHA_QA_SANITIZADA.md` | QA resource identifiers, two articles and final status |
| `08_REPRODUCCION_SEGURA.md` | Non-destructive Windows/PostgreSQL playback and validation sequence |
| `09_RIESGOS_DEUDAS_Y_DECISIONES.md` | Real challenges and proposed priorities, without inventing defects |
| `10_CHECKLIST_REVISION_Y_PUBLICACION.md` | Prior review, distinction of audited/unaudited and next decision |
| `11_EVIDENCIA_ESTRUCTURADA.json` | Readable summary by QA tools, with results and no secrets |
| `12_MANIFIESTO_GIT_BLOBS.md` | Git blob identifiers verified in the PR; replace hashes from the previous ZIP that no longer correspond to the revised content |
| `13_EVALUACION_OBSERVACIONES_IA.md` | Reasoned contrast of 14 external observations, decisions and priorities without changing code |
| `14_REVISION_INTEGRAL_DOCUMENTAL.md` | Editorial/technical control report, corrections and explicit scope of the OK documentary |

## Strict security policy

- **Not included** passwords, session tokens, real Bearer headers, actual idempotency keys or their application values, hashes of those values, base credentials, or emails from QA user.
- Some are retained **UUID QA resources** (company, locations, items and operations) because they are useful business identifiers to contrast the leadger. **They're not credentials.**. UUIDs of personal identity are omitted.
- Not included `curl` copied from Swagger, precisely because it could expose a sensitive header. Responses are reduced to codes, states, quantities, events and verifiable relationships.
- A valid Bearer header was copied in the QA conversation. **then contributed a `POST /api/v1/auth/logout` with HTTP `204 No Content` and the same token displayed**, on 09/11/2026 at 15:23:37 GMT. **Revocation of that session confirmed by reported Swagger response**consistent with `SessionService.logout()`; it is not an independent SQL inspection nor does it imply the revocation of other sessions. **The token never reproduces.**
- Any new capture or transcription must be inspected and healed **before** to attach it or upload it to Git.

## Origin and degree of proof

**CI-VERIFIED:** execution observed in GitHub Actions associated with a specific commit.  
**LOCAL-REPORTED:** PowerShell output copied by the developer; no independent remote access to your machine.  
**SWAGGER-REPORTED:** real HTTP response provided by the developer; its consistency with the flow and code consulted was validated.  
**CODE-INSPECTION:** existing files in GitHub `main` to the indicated SHA.  
**PENDING:** There's enough evidence missing or it's out of this court.

Total **840 approved tests does not mean 840 inventory-only tests or 100 % coverage**: The suite covers all backend modules up to E2-5 C.

## Source of truth

The public repository (documents E2-5 A/B/C, routers, services, ORM, migration, tests and PR #21–#23), GitHub Actions executions and Swagger/PowerShell record of this conversation were cross-checked. **The commit code is a source of truth for the implemented behavior**; the A/B/C increment documents that still say "to be merge" describe the state of that moment, not the current state. This package clarifies this evolution without rewriting historical documents.

**Final location:** `plataforma-pyme/docs/revisiones/E2-5_CIERRE/` en `main`. **Original SHA documentary:** `c66df2f8ddaa8179ca12e342bd3099348bc6b155`; **Functional SHA examined:** `748e69319d8d04900c009d5184168a264a9deeac`. A subsequent commit to update these texts does not change the SHA from the original closure. The independent audit is still pending.

## Changes to this review (v1.2, over v1.1)

A new **documented critical opinion** on contributence, semantics of initial stock, reverses, authorization, SQL audit, reservations, HTTP errors and business limits. Comments received are **assumptions and proposals**You don't prove a bug by yourself. [13_EVALUATION_OBSERVATIONS_IA.md](13_EVALUACION_OBSERVACIONES_IA.md) y [09_RIESGOS_DEUDAS_Y_DECISIONS.md](09_RIESGOS_DEUDAS_Y_DECISIONES.md). The v1.0 documentation remains as a reading background, but the ZIP v1.0 hashes do not validate this versioned revision. Authentication terms, references to manifesto, checklist and academic index were corrected; see [Minutes 14](14_REVISION_INTEGRAL_DOCUMENTAL.md).

La [formal delivery sheet](../E2-5_ENTREGA_PARA_REVISION.md) y el [Technical audit package](../E2-5_AUDITORIA/00_LEEME_Y_PRECONDICIONES.md) They're **prepared in the PR**the audit is not performed; the auditor must start from the audited SHAs when this documentation is approved and published.

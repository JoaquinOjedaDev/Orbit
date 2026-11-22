# E2-5 — Resource sheet and QA results (no key)

**Ambient:** backend local `http://127.0.0.1:18000`, PostgreSQL/Docker de desarrollo, 09/11/2026. **Warning:** the IDs of this tab are **commercial resources of QA**, no sessions or key idempotent. Your publication should only be authorized at the final closure after reviewing your computer's data policy.

## 1. Company and locations

| Alias | Name | Resource ID | Capacity |
|---|---|---|---|
| EMP-QA | Trade QA E2-5 | `3b161aa4-f476-4efc-8293-5978d590e0fe` | Active Company, Tenant of the tests |
| DEP-QA | QA deposit | `b492ced2-0faa-42d8-b652-609fc4c2b6f4` | `DEPOSITO`, `can_store=true`, `can_sell=false` |
| CASA-QA | Home | `a741f945-5c88-4855-8ff0-708374ac16f8` | `CASA`, `can_store=true`, `can_sell=false` |

The operative actor was the **Administrative holder of EMP-QA**. Your email, password, personal identifier and tokens are omitted.

## 2. Independent articles

| Alias | Item | Catalogue ID | SKU | Unit |
|---|---|---|---|---|
| ART-A | QA balanced food | `e3bcd831-1ae5-48ab-b1c1-0c43e58ae84b` | `ALIM-E25-001` | `UNIDAD` |
| ART-B | QA Stock Initial Cookies | `97cc90f6-6bef-487e-b8f4-76f132bbf0d1` | `INICIAL-E25C-001` | `UNIDAD` |

## 3. Final state observed by GET

| Item | Location | `quantity_milli` | Equivalence | `version` | Last update UTC |
|---|---|---:|---:|---:|---|
| ART-A | DEP-QA | `6000` | 6 units | `2` | `2026-11-09T11:48:06.063460Z` |
| ART-A | CASA-QA | `4000` | 4 units | `1` | `2026-11-09T11:48:06.063460Z` |
| ART-B | CASA-QA | `6000` | 6 units | `3` | `2026-11-09T12:50:22.511667Z` |

`ART-A` sum 10 units in both locations; `ART-B` sum 6 units in Casa. No ART-B balance was reported in DEP-QA and **You don't make up.** one row `quantity_milli=0`: absence of existing row and zero balance are different situations in the initialization rule.

## 4. Historical checks

| Process | Type | Proof ID | Quantity |
|---|---|---|---|
| Purchase ART-A | Purchase E2-4 | `c890b079-5d4c-4977-8143-258946d92060` | 10 units, total 100000 ARS cents |
| ART-A Reception | E2-4 Reception | `b5c6ce63-d99a-473a-83a1-2ee07eba1132` | +10000 en DEP-QA |
| Art-A transfer | `TRASLADO` | `be1de1eb-90bc-4be3-ac6e-84f5e9d1640f` | −4000 DEP-QA and +4000 CASA-QA |
| Initial ART-B | `STOCK_INICIAL` | `c23fb5f0-7a14-43cf-98ba-d572e79a1bdd` | +5000 CASA-QA |
| Ajuste positivo ART-B | `AJUSTE_ENTRADA` | `bd324719-52b7-44ee-a4c3-17d1ace2a04d` | +2000 CASA-QA |
| Negative adjustment ART-B | `AJUSTE_SALIDA` | `2caf25a3-966c-450e-8527-58ae95679ce9` | −1000 CASA-QA |

Detailed transcripts and their progression are explained in `02_BITACORA_SWAGGER_E2-5_B.md` y `03_BITACORA_SWAGGER_E2-5_C.md`.

## 5. NOT deliberately recorded

No real retry key, no header `Authorization`, access token, password, personal identity, QA mail, connection chain, configuration `.env` No sensitive security data. If an auditor needs to play a replay, he must generate **your own session and ephemeral keys** in a new test tenant and document only the results.
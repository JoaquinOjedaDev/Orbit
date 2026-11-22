# E2-5 — Trace matrix RF/CU → code → evidence → evidence

**Classification:** `AS-IMPLEMENTED` (existing in `main`), `CI-VERIFICADO` (GitHub Actions), `SWAGGER-REPORTADO` (developer), `LOCAL-REPORTADO` (PowerShell), `DIFERIDO` (not implemented). Do not confuse a visual model with real backend.

| RF/CU | Rule/capacity | Effective source | Specific evidence | Status to the closing SHA |
|---|---|---|---|---|
| **RF-06 / CU-08** | Check balance by company, location, item | `purchases/inventory_router.py`, `receipt_service.py`, `stock_balance.py` | B-09/B-12, C-10 (`200`); balance tests | AS-IMPLEMENTED + CI + Swagger |
| **RF-06 / CU-08** | Consult leader with signed entries and exits | `inventory_router.py`, `receipt_schemas.py`, `stock_movement.py` | B-13 y C-11 (`200`three moves per article) | AS-IMPLEMENTED + CI + Swagger |
| **RF-06 / CU-09** | Transfer between two locations of your own and suitable | `transfer_router.py`, `transfer_service.py`, `transfer_schemas.py` | B-08 (`201`), B-09 (`200`), `test_transfer_api_integration.py` | AS-IMPLEMENTED + CI + Swagger |
| **RF-06 / CU-09** | Atomic dual movement, total constant balance | `transfer_service.py`, `inventory_operation.py`, `stock_movement.py` | `-4000/+4000=0`, 6+4=10; transaction B tests | AS-IMPLEMENTED + CI + Swagger |
| **RF-06 / CU-09** | Replay no duplica stock | `transfer_service.py`, UNIQUE by company/application | B-10 (`200`), history B-13; race and collision tests | AS-IMPLEMENTED + CI + Swagger |
| **RF-06 / CU-09** | Insufficient balance does not allow negatives | `transfer_service.py`, `stock_balance.py` | B-11 (`409`), B-12/B-13 unchanged; test of two rival outputs | AS-IMPLEMENTED + CI + Swagger |
| **RF-06 / CU-11** | Initialize a balance once per article/location | `adjustment_router.py`, `adjustment_service.py`model A | C-03 (`201`), C-04 (`200`), C-05 (`409`) | AS-IMPLEMENTED + CI + Swagger |
| **RF-06 / CU-11** | Input/output adjustments justified | `adjustment_schemas.py`, `adjustment_service.py` | C-06/C-07 (`201`), C-11 (ledger) | AS-IMPLEMENTED + CI + Swagger |
| **RF-06 / CU-11** | Observed version and rejection by race/obsoleescence | `adjustment_service.py`, `stock_balance.py` | C-09 (`409`), C-10 version 3, `test_adjustment_concurrency_integration.py` | AS-IMPLEMENTED + CI + Swagger |
| **RF-06 / CU-11** | No output above availability | `adjustment_service.py` | C-08 (`409`), C-10/C-11 intact; exit tests | AS-IMPLEMENTED + CI + Swagger |
| **RF-03 / CU-04** (dependencia) | Location and STORE permits for inventory | `locations/permissions.py`, `LocationAssignment` | Two QA locations; RBAC/tenant tests in B/C | AS-IMPLEMENTED + CI |
| **RF-04 / CU-05** (dependencia) | Well physical, SKU by company, unit | `catalog/`, `CatalogItem` | B-04 y C-01 (`201`); B-05 (`422`) | AS-IMPLEMENTED + CI + Swagger |
| **RF-05 / CU-06–07** (dependencia) | Separate purchase from physical reception | `purchases/{router,receipt_router,receipt_service}.py` | B-06 `REGISTRADA`, B-07 `RECIBIDA` + movement | AS-IMPLEMENTED (E2-4) + CI + Swagger |
| **RF-07 / CU-10** | Transactional discount for backend sale | Not E2-5 A–C | No actual E2-5 test for sale connected | **DIFFERENT**, do not compute as implemented |
| **Advanced RF-06** | Absolute physical count, multiple, continuous reconciliation | Only proposals and ADR | No endpoint/studies closed to that scope | **DIFFERENT** |

## Academic sources to be cross-checked during the review

- `plataforma-pyme/entrega-programacion-2/01_ANALISIS_DE_REQUERIMIENTOS.md`: RF-06, non-negative stock RN, buy/reception separation, MVP range.
- `plataforma-pyme/entrega-programacion-2/02_CASOS_DE_USO.md`: CU-07, CU-08, CU-09, CU-11 and the rules of continuance, tenant and retry.
- `plataforma-pyme/entrega-programacion-2/03_MODELO_DE_DOMINIO_Y_UML.md`diagram `03B_CLASES_COMERCIO_E_INVENTARIO.puml`: general conceptual design, **no** automatically copy TO-BE entities to code.
- `plataforma-pyme/entrega-programacion-2/04_ARQUITECTURA_Y_PATRONES.md`: HTTP/Service/session/SQL separation, with inherited sections that still speak in the future.
- `plataforma-pyme/entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md`: Cumulative and historical matrix; review current state without confusing previous headers with the effectively integrated.
- `plataforma-pyme/docs/ADR/ADR-004-stock-unidades-sku.md`: units, movement history and count version.
- `plataforma-pyme/docs/E2-5_{A,B,C}_*.md`: incremental development contracts, several written headers **before the merge**.

## Rule of documentary reading

The evidence is **posterior** to the status showing some technical document headings. For example, phrases "to be merged" in A/B/C documents describe their historical context; this closure takes as reference the SHA `748e693...` and the three PRs **effectively merged**. A status or index addendum is proposed, **not retrospectively edit historical statements without dialing versions**.

## Aspects still without independent certification

Permits/tenants in complex career conditions, immutability to direct SQL, tolerance to unreceived deadlocks, regression of frontend, exhaustive equivalence with all UML attributes and coverage against the original academic slogan require a **separate audit**, for which it was prepared [a formal order](../E2-5_ENTREGA_PARA_REVISION.md) **after the documentary review**No execution yet.

## Annex v1.1 — Verification of external observations

Post-QA design evaluation **does not change** The AS-IMPLEMENTED state of E2-5 A–C neither certifies future requirements. The RF-06/CU-09 and CU-11 cases maintain their existing tests; there are no specific inbound transfer intercalation trials vs. adjustment on the same destination and restricted runtime SQL role tests. The RF-05 cases (partial reception, multiple destination and monetary document) and RF-07 (reserved sale/stock) remain pending with their own decisions and development. [Opinion 13](13_EVALUACION_OBSERVACIONES_IA.md) y [risks 09](09_RIESGOS_DEUDAS_Y_DECISIONES.md).

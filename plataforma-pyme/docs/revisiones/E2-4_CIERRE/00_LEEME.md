# E2-4 — Functional closure, evidence of use and review of observations

**Project:** Generalistic and multi-company SME platform · Programming 2, UNSAM, 2C2026.
**Test cut:** 08/11/2026.
**Audited code:** `main`, commit `4f88416141c09a82e744990b1aee8c00b9f31dfd`.
**Status:** functional closure E2-4 backend A-E, without declaring production or complete external audit.
**Local:** 797/797 tests on DB Windows with previous QA data.
**CI:** 3/3 jobs, Python 3.12/3.14, PostgreSQL 16, `e24e_receipt_stock`.

## File by Target

| File | Uso |
|---|---|
| [01 Consolidated report](01_INFORME_CONSOLIDADO_E2-4.md) | Master academic report, results and scope |
| [02 Swagger Log](02_BITACORA_PRUEBAS_SWAGGER.md) | **17 cases** observed; inputs, data, HTTP, outputs |
| [03 Tests y CI](03_PRUEBAS_AUTOMATIZADAS_Y_CI.md) | Evolution by PR, 797 tests, local error and PR #18 |
| [04 Architecture](04_ARQUITECTURA_API_Y_DATOS.md) | Actual contracts, tables, transactions, risks contrasted with code |
| [05 Traceability](05_TRAZABILIDAD_Y_PENDIENTES.md) | RF/CU → endpoints → tests; pendientes priorizados |
| [06 Ficha QA](06_FICHA_DATOS_QA.md) | UUID company, supplier, item, purchase, deposit, receipt and movement |
| [07 Reproduction](07_GUIA_REPRODUCCION_SEGURA.md) | PowerShell Guide, Swagger and non-mutate verification historical purchase |
| [08 Anexo JSON](08_EVIDENCIA_QA_SANITIZADA.json) | Structured QA without secrets, useful for automatic review |
| [10 Observations](10_OBSERVACIONES_DE_AUDITORIA_Y_DECISIONES.md) | Reasoned response to external comments; not called the full independent audit |
| [HTTP Collection](requests/E2-4_QA.http) | Parametrized examples of supplier/buyer/replay/reception/stock |
| `09_MANIFIESTO_SHA256.txt` | Hashes SHA256 of the versioned content, format `sha256sum -c` |

## Security policy and provenance

- **No passwords are being versioned, tokens Bearer, real idepotent keys, `request_id` or connection chains.** QA resources UUIDs are preserved because they allow testing of GET and integrity; they do not amount to credentials.
- `Swagger UI`: codes and bodies provided in conversation by the developer; classified as **observed/reported**Not as executed by an independent reviewer.
- `Windows`: Pytest/Alembic/Docker reported by developer (20/20 and 797/797 at close).
- `GitHub Actions`: 6 final runs and three job cuts verified by GitHub; the last run is 42530739959.
- **Suppliers:** a complete transcript of manual CRUD tests is missing; automatic/CI tests do exist. Do not simulate non-existent evidence.
- **Reproduction:** keys are omitted on purpose. Create an isolated scenario NEW to demonstrate replay without disclosing previous keys.
- **PDF:** the original consolidated PDF remains as external academic export. **No PDF or ZIP version in Git** to avoid duplicating binary content.
- **Integrity:** after reviewing Markdown/JSON/HTTP documents, regenerate `09_MANIFIESTO_SHA256.txt`. Check in folder with `sha256sum -c 09_MANIFIESTO_SHA256.txt` in a terminal with `sha256sum` installed. Pure PowerShell can be compared `Get-FileHash -Algorithm SHA256`.

## Repository relationship

- Evidence E2-4 by sub-increment: `plataforma-pyme/docs/E2-4_{A,B,D,E}_*.md`. Son **historical documents of each court** and can describe pending that are now implemented. Do not retrospectively rewrite its content.
- Source of code: `plataforma-pyme/backend/app/modules/{suppliers,purchases}/`migrations `backend/alembic/versions/20261108_0012…0015` y tests.
- Requirements documents: `plataforma-pyme/entrega-programacion-2/01…05`; the broader conceptual schemes are **TO-BE** when they exceed what is implemented.
- Delivery sheet for a second formal audit: [E2-4_ENTREGA_PARA_REVISION.md](../E2-4_ENTREGA_PARA_REVISION.md)The external review received was an evaluation of the documents, **no** the reviewer's report that can still be handled.

**Rule:** This closure does not allow initiating refactors, API changes, new migrations or pending business operations without deciding on scope and testing.

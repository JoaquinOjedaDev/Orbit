# E3-2B · B5 — Comprehensive UX of QR collections and preparation of QA B1–B6

**Rama:** `feature/e3-2b-mercadopago-qr-demo`  
**Status:** B5 implemented in the branch, submitted to IC. It is not integral acceptance; B6 remains pending.  
**Policy:** DO NOT require intermediate manual tests. DO NOT make partial merge a `main`.

## Objective

Close usage gaps between B1–B4 without altering your sales or payment rules: a company can travel through Media of collection → POS → generation of QR DEMO → history and detail → simulated laboratory → sale QA → proof, and return to any of the screens after recharging the session.

## Changes in backend

- **GET** `/api/v1/businesses/{business_id}/qr-payment-intents?offset=0&limit=20` (limit of 1 to 50): PostgreSQL paged in deterministic order `created_at DESC, id DESC`.
- The owners and active administrators see the company’s attempts. Managers and workers see only those created with their identity; other businesses respond 404.
- The list returns metadata of amount and status, `sale_id` if it is already finished, but **no** delivers QR PNG images, notes or cart lines. The detail remains protected by your existing endpoint.
- The expired QRs are presented as `EXPIRADA` without modifying the base or writing sales movements. Users can still open the attempt and consult the logbook.

## Changes in frontend

- **Side menu:** new section `Cobros QR` under Operations, associated with the active company; route `/real/empresas/{business_id}/cobros-qr`.
- **Collection history:** cards respond with date, total, fictional reference, status, relationship with voucher, access to detail and pagination.
- **Means of collection:** direct access to history and POS, clarification that a linked DEMO account can already create QR but NOT collect funds. Faced with a 409 decoupling with pending QR, leads to review the history.
- **Point of sale:** access to prior QR collections without losing business context.
- **Detalle QR:** access to history, messages and specific next steps for pending, DEMO approved, rejected, cancelled, expired, uncertain, reviewed and completed.
- **Closing with uncertain result:** the interface requires that you consult with GET the QR and its events; when there is no proof and the status continues `APROBADA_DEMO`, allows you to retry **the same idempotent endpoint and the same QR**without generating a new sale.
- **Mobile and accessibility:** grid 1 column, minimal touch buttons 42–44 px, accessible states and errors with `role=status`/`role=alert`, hierarchical headers, visible focus and adaptable text.

## Automatic QA B5

- Backend: authenticated endpoint, company isolation, partner role, pagination and limits, expiration calculated without mutation, bonding of voucher after closing B4.
- Frontend: URL by company, tenant validation, summaries without credentials, answers with `sale_id` rejected incompatible, repeated IDs, pagination and semantic states.
- Run on GitHub Actions: Frontend (compilation, lint, Node); Backend FastAPI (Python 3.12/3.14, Postgres, migrations); REAL full-stack inventory (API, permissions, desktop/mobile browser regression).
- The interactive visual path of QR and real OAuth requires complete B6 and isolated QA configuration. IC regression does not amount to human test point-to-point.

## Limit with Market Payment

B5 does not incorporate OAuth, `qr_data` real, webhooks or bank reconciliation. `APROBADA_DEMO` y `FINALIZADA` are two different facts: the first is a fictitious event, the second is a proof of sale **only from the disposable QA base**. None of them test an external accreditation.

## Next block: B6

Integrate company account via official authorized flow, model box/branch, create dynamic QR commands with the official API, verify authenticity of notifications and reconcile with internal states without duplication. Before enabling a supplier test there must be credentials, accounts and capabilities compatible with the Market Payment testing environment.

## Time to ask for user functionality tests

Only when all these conditions are met:

1. B1–B6 integrated and with all migrations and automatic tests in green **the same SHA** de la rama.
2. Disposable environment of prepared test, without touching usual local base or production credentials.
3. Full-use matrix and script published, including roles, QR in detail, simulated states, stock closure, retry/failure, and official sandbox QR connection when available.
4. Prior technical audit without critical findings of duplication, tenant isolation or credentials.

Just then, tell the user what to install/execute, with PowerShell commands and verification of expected results, before your explicit authorization to merge a `main`.

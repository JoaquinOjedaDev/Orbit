# E2-4 A — Suppliers: PostgreSQL model and migration

**Date:** 2026-11-08. **Status:** Proposed implementation in feature/e2-4a-suppliers, pending IC and Windows validation.
**Base:** E2-3 E, commit e4ddd394dac9af2875a88dd77b66362b559d6cf6.
**Scope:** RF-05, support CU-06/07. Only backend and documentation of this cut, exclusively inside platform-pyme/.

## 1. Decisiones

- SQLAlchemy entity **Supplier** y tabla **suppliers**. New company = zero suppliers; no purchases, locations, stock or seats are created.
- PK UUID \`id\`, FK \`business_id → businesses.id\` con **RESTRICT** y UNIQUE \`(business_id,id)\` prepared for composite commercial references.
- Required name 2–90 characters and key \`name_key\` unique per tenant, **including INACTIVE fact sheets**. The same name can be used in different companies. API E2-4 B will calculate \`name_key\` with NFKC, collapsed spaces and \`casefold\`, and manage SQL collisions using 409/rollback. PostgreSQL protects the stored key; it does not normalize all external SQL inputs by itself.
- Profile fields matching the DEMO prototype: \`offerings\` (240), \`contact_person\` (100), \`phone\`/ \`whatsapp\` (35), \`email\` (120), \`address\` (160), \`maps_url\`/ \`website\` (2048), \`instagram\` (31), \`notes\` (650). Only the name is mandatory; the rest is saved as a non-null string with an empty initial value.
- \`payment_methods\` y \`promotions\` are non-null JSONB arrangements, with default values \`[]\` and CHECK of **type of arrangement and maximum size** (7 methods and 8 promotions) will be replaced entirely in future editions, so as not to omit profound changes in JSON structures.
- Validations of the content of those arrangements, mail/WhatsApp format, HTTPS security, permitted media, promotional days and texts will be implemented in E2-4 B before displaying HTTP writing. **Promotions are descriptive; they do not generate automatic discounts.**
- \`status\` = \`ACTIVO/INACTIVO\`, initial active state. Physical deletion is not included.`created_at\` y \`updated_at\` are TIMESTAMPTZ columns; automatic update via ORM does not replace a trigger for direct SQL.
- Future Purchase may register supplier **optional**; even a vendorless purchase must keep its own history and snapshots. In E2-4 A there is no API for this.

## 2. Cut Files

1. \`backend/app/infrastructure/models/supplier.py\` — model, FK, UNIQUE and CHECK.
2. \`backend/app/infrastructure/models/__init__.py\` — register for Alembic metadata.
3. \`backend/alembic/versions/20261108_0012_suppliers.py\` — additive migration`e24a_suppliers\` descendant of`e23a_catalog\`.
4. \`backend/tests/test_supplier_model.py\` — structural tests without PostgreSQL.
5. \`backend/tests/test_supplier_integration.py\` — real SQL inserts, restrictions, rollback and independence of tenants.
6. \`backend/tests/test_postgres_integration.py\` — expected review of Alembic.

No change to frontend, HTTP paths, E2-1/E2-2, previous models, applied migrations, UML 03A/03B/03C or the independent review sheet E2-3.

## 3. Windows validation after integrating this increase in main

With PostgreSQL Docker healthy development, from \`plataforma-pyme/\`:

~~~powershell
git switch main
git pull --ff-only origin main
docker compose ps
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
cd ..
~~~

**Waited:** \`e24a_suppliers (head)\`, without new Alembic operations and complete suite successful. The number of tests and the final result will be recorded after running them, they are not invented.

Migration does NOT delete data, DOES NOT alter tables E2-3 and DOES NOT create fictitious providers. Do not execute \`alembic downgrade\` against actual data or`docker compose down -v\`.

## 4. Explicit pending

E2-4 B: CRUD API/state, permissions, canonical and semantic validation, HTTP contracts, isolation and careers. E2-4 C/D: snapshot purchases and registration without reception. E2-4 E and E2-5: real and idempotent receipt over ledger/transactional balance. Frontend continues in DEMO; this cut is not the complete MVP or a productive deployment.

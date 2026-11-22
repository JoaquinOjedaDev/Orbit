# ADR-008 — Coexistence with academic TP and API transition
**Date:** 2026-11-06  
**Status:** PROPOSAL; PENDING code integration strategy up to E2.  
**Responsible for approval:** TP team/integration officer (to be designated).  
**Sources:** E0-A ``1/5/9; E0-B ``1–4 and 12; master plan v4 ``3–5; backlog v4 `TP3.

## Context
In the shared repository coexist `Proyecto-3-AppAdmin-Mascotas/`, `Proyecto-3-Extendido-Generico/` y `plataforma-pyme/`. The user asked to work directly on `main` The Programming TP 2 has academic requirements and evolving backend. It should not confuse product platform with a version of the TP or alter peer work by accident.

## Proposed decision
1. Build new IU/low documentation `plataforma-pyme/`, **within the same GitHub** and currently in `main`, without creating independent repository. Do not alter files outside that path during E0/E1 unless agreed by the computer.
2. Version each cut with limited scope commit; check other people's changes before adding files. Do not use `git add .` if there are local files of other members without review.
3. Do not duplicate or transfer `Proyecto-3-Extendido-Generico/backend/` before evaluating code, tests, migrations and dependencies in E2.
4. En E2 mapear **≥5 high-level academic requirements** a endpoints; FastAPI + SQLAlchemy 2.x + PostgreSQL + Alembic, authentication, Docker, tests, CI GitHub Actions, UML, justified pattern, README, documentation and deployment planned according to the original slogan.
5. TP3 requires **≥10 unit tests performed** (not replaceable by documentary list, E2E or integration tests only). `Proyecto-3-AppAdmin-Mascotas/` for compatibility assumptions.
6. Future product backend will be authority over stock, sales, cash, permits and records; the IU should not retain a second authority when switching to `ApiGateway`.
7. MP OAuth/Orders/webhooks will be integrated after consolidating valid API, tests and supplier accounts; E1 QR will be DEMO.

## Alternatives
- Replace academic backend on site immediately: discarded by high risk over shared work.
- External repository or mandatory branch: not adopted by explicit preference of the equipment; future branches remain available.
- Force all business needs to inherited UML: discarded; first contracts are drawn up and validated.

## Risks and tests
- Risk of simultaneous changes in `main`: partners must agree responsible, review `git status` y `git pull --ff-only` before you publish.
- **TP3-01/02:** compliance matrix and verifiable evidence of tests and IC.
- **API-01..06:** development in cuts (identity/scoping → catalog → stock → sales → box), with PostgreSQL and rollback in bugs.

## Earrings for E2
Final location of the backend, M01/M02 reuse strategy, migrations, design pattern and deployment **no** are considered resolved by this ADR.
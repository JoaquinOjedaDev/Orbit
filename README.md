# Orbit

Orbit is a multi-tenant operations platform for small businesses. It brings purchasing, inventory and point-of-sale workflows into one workspace, with company-scoped access and an auditable inventory ledger.

- **Purchasing and inventory** covers suppliers, purchase receipts, stock adjustments and atomic transfers across locations.
- **Point of sale** records sales and receipts, with retries designed to avoid duplicate transactions.
- **Access** includes company memberships and location-level permissions.

The application uses React and TypeScript, FastAPI, PostgreSQL, SQLAlchemy and Alembic. It includes a local demo and an API-backed workspace.

## Run Orbit

[Start locally](docs/getting-started.md) for the demo, PostgreSQL setup and verification commands.

## Project layout

| Path | Contents |
| --- | --- |
| [Frontend](plataforma-pyme/frontend/) | React interface and browser tests |
| [Backend](plataforma-pyme/backend/) | FastAPI routes, data models, migrations and tests |
| [Engineering notes](plataforma-pyme/docs/) | Architecture decisions and validation records |
| [Course delivery](plataforma-pyme/entrega-programacion-2/README.md) | Requirements, use cases and UML |

Orbit was developed for the Programming 2 course at Universidad Nacional de San Martín.

# Run Orbit locally

## Demo

From the repo root, run with Node.js 24:

```sh
cd plataforma-pyme/frontend
npm ci
npm run dev
```

Open [the demo](http://localhost:5173/inicio). Sample data stays in your browser.

## Full app

Keep the frontend running. Install Python 3.12 and Docker Compose, then copy `plataforma-pyme/.env.example` to `plataforma-pyme/.env` and set `POSTGRES_PASSWORD`.

In a second terminal, start from the repo root:

```sh
cd plataforma-pyme
docker compose up -d --wait db
cd backend
python -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

On Windows, use `.venv\Scripts\python.exe` in place of `.venv/bin/python`.

Open [Orbit](http://localhost:5173/real/login) or the [API docs](http://localhost:8000/docs).

## Checks

- Frontend: `npm run build && npm run lint`
- Backend: `.venv/bin/python -m pytest`
- Integration tests: [backend](../plataforma-pyme/backend/README.md) and [browser](../plataforma-pyme/frontend/e2e/README.md)

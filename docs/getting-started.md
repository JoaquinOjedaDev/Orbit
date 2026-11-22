# Run Orbit locally

## Start the browser demo

Install Node.js 24 with npm. From the repository root:

~~~sh
cd plataforma-pyme/frontend
npm ci
npm run dev
~~~

Open <http://localhost:5173/inicio>. The demo keeps sample data in the browser.

## Start the API-backed workspace

Install Python 3.12 and Docker Compose. From the repository root:

~~~sh
cd plataforma-pyme
cp .env.example .env
~~~

In PowerShell, the copy command is `Copy-Item .env.example .env`. Set a local `POSTGRES_PASSWORD` in `.env`. Then start PostgreSQL and the API:

~~~sh
docker compose up -d --wait db
cd backend
python -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
~~~

On Windows, use `.venv\Scripts\python.exe` for the Python commands. Start the frontend in a separate terminal as above and open <http://localhost:5173/real/login>. The development server proxies API calls to port 8000. API documentation is available at <http://localhost:8000/docs>.

## Verify changes

- From `plataforma-pyme/frontend`, run `npm run build` and `npm run lint`.
- From `plataforma-pyme/backend`, run `.venv/bin/python -m pytest`.
- For database and browser integration checks, see the [backend guide](../plataforma-pyme/backend/README.md) and [browser test guide](../plataforma-pyme/frontend/e2e/README.md).

Keep `.env` local. Use sample data and a disposable database for tests that write records.

# E3-3 · Proof publication (2 persons): Supabase + Render

**Status:** technical preparation in the field `feature/e3-3-supabase-public-qa`, no external account was deployed or created.

## Scope and decisions
- Objective: two different browsers/devices, independent users, a single shared base and multi-company isolation. Check also invitation and roles, real POS operations with declared payments, inventory, catalog and photos.
- **Supabase = PostgreSQL only.** Identity, sessions, permissions and SQLAlchemy/Alembic are still in FastAPI. Do not manually create tables in SQL Editor or enable Supabase Auth or Data API from the frontend.
- **Render = a public Web Service Docker** which builds React with Vite and serves both React and FastAPI from the same HTTPS source. Avoid CORS, two front and API providers, and Vite proxy configurations in production.
- **Safe mode:** `PYME_DISPOSABLE_QA=0` and all MP TEST/shared flags disabled. Do not use the seller or QR TEST shared on a public site. You can try catalog, POS, *declared* payments and invitations; official MP collection is out of this stage.
- Photos webp persisted in `photo_assets`/PostgreSQL BYTEA by application, not in temporary filesystem of Render.
- Fictional data only; do not use names, emails, passwords or actual payments in the tests. This environment is not considered suitable for production.

## 1. Create a new PostgreSQL project (owner's action)
1. Enter https://supabase.com/dashboard and create project **new** Call `plataforma-pyme-qa-public` (name is suggested). Existing project region: us-west-2 (Oregon); set up Render in oregon and a strong base password to be saved **outside the repository and chat**.
2. En **Connect** elegir **Session pooler**, mode session, **port 5432**, for Render IPv4 server. Do not copy the IPv6 direct connection from `db.<ref>.supabase.co`, ni Transaction pooler 6543. Ver docs oficiales: https://supabase.com/docs/guides/database/connecting-to-postgres.
3. From that screen get exactly **HOST**, **USER** (normally `postgres.<project-ref>`), **PORT=5432**, **DATABASE=postgres**The pooler host does not infer: copy it.
4. **Mandatory safety BEFORE creating tables**: on the Supabase dashboard open **Data API → Integrations / Data API Settings** and disable **Enable Data API**This system does NOT use `supabase-js`, REST or GraphQL; all queries pass through FastAPI. Leaving the Data API enabled could expose schema tables `public` no RLS, depending on the project’s grants. Also check the adjustment **Automatically expose new tables** and keep it off. The direct PostgreSQL/pooler connection will continue to work. Documentation: https://supabase.com/docs/guides/api/securing-your-api.
5. Do not paste the entire URL with your password into tickets, screenshots or ChatGPT. Just share project confirmation created, region and, if necessary, host without credentials.

## 2. Create a Render Blueprint after the approved Merge
1. Enter https://dashboard.render.com, connect the repo `JoaquinOjedaDev/Orbit` y crear un Blueprint desde `render.yaml` (at the root of the repo), **only when in main**.
2. The Blueprint creates only `plataforma-pyme-qa-public` in Free plan; does not modify service `walos-api` previo ni crea base Render.
3. Bury the secrets **on the private Render form**:
   - `DB_HOST`: host exacto del Session pooler.
   - `DB_USER`: usuario exacto del Session pooler.
   - `POSTGRES_PASSWORD`: Supabase project password.
   - `DB_NAME=postgres`, `DB_PORT=5432`, `DB_SSLMODE=require` They're already defined.
4. `Dockerfile.public` installs backend, compiles frontend and executes `alembic upgrade head` in the new and empty Supabase project **before** uvicorn start. In Render Free an instance can sleep; restart does not delete the tables from Supabase. Never target the local TP DB or an existing base.
5. Check `https://<nombre-elegido>.onrender.com/health` -> `status:ok`, `/ready` -> `database:ok`; then visit `/real/registro`. The route `/` maintains DEMO, which does not record real data.

## 3. Test matrix from 2 browsers
- **A (holder):** Register, create Company A, add location, item with price, stock; create sale small amount POS and payment declared in QA.
- **B (independent):** register, create company B; you should see **only B**, without catalog, sales, members or A. Try cross-requests by API against A resources (403/404).
- **Collaboration:** A invites B (code/invitation), B accepts; with assigned role and corresponding permissions, B can consult/operate Company A without losing the isolation of its company B. Load an article and verify in browser A that both see the change after refresh.
- **Persistence:** make F5, go out and re-enter, confirm data in both browsers. Login may be required again by current design (token in memory).
- **Photos:** upload a photo and view it from the other device with authorized access.
- **QR:** use the DEMO ID QR only as information; do not activate the shared box or simulate accreditations on the public site.

## 4. Risks and validations
- Render Free may suspend the process after inactivity and delay the first admission; it is intended for testing and does not offer commercial availability.
- Supabase Free has storage limits, traffic, connections and possible paused by inactivity; monitor both panels.
- Backend calls use the same HTTPS URL as the page. Do not post base keys or Access tokens MP in variables `VITE_*`.
- **Output lock**: do not deploy before verifying that the **Supabase Data API is disabled**, so that the PostgreSQL tables of the backend are not queryable outside FastAPI.
- No local data migration is performed; the new Supabase starts empty. Keep intact `asistente_pyme` y la base Docker QA local `asistente_pyme_mp_b7_20261113_013813`.
- Without public proof of two users, **no** declare functional publication or production merge.

## 5. Reversal
Disable the Web Service from Render, without removing Supabase immediately. Maintain the base while investigating. Remove QA secrets/instances after exposure and final evaluation.

## Sources
- Supabase: https://supabase.com/docs/guides/database/connecting-to-postgres
- Render Blueprint: https://render.com/docs/blueprint-spec
- Render Free: https://render.com/docs/free

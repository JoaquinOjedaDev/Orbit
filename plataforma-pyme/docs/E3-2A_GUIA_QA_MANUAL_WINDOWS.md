# E3-2A — Windows Manual Testing Guide (prepared, not yet executed)

**Status:** checklist to run with the user after technical audit.
**PR:** #65, rama `feature/e3-2a-imagenes-real-backend`.
**IMPORTANT:** This document does not authorize or execute migrations on the usual local basis. Do not use the current commercial/educational base for loading QA.

## 0. Safe and isolated preparation

The GitHub Actions automated test uses PostgreSQL 16 ephemeral with `PYME_DISPOSABLE_QA=1`. Manual validation will be done in **another Docker instance with Compose project and differentiated port**. Do not edit `main` or the main repository to test the PR. Do not use `docker compose down -v`, `reset --hard`, or delete files from third parties.

**First terminal, code only —** from PowerShell, without credentials:
```powershell
$repo = "C:\Users\Jorge\Desktop\Jorge\Programacion 2\TP Final\Orbit"
$qa = Join-Path (Split-Path $repo -Parent) "TP-PyME-E3-2A-QA"
git -C "$repo" fetch origin
if (Test-Path -LiteralPath $qa) { throw "El destino QA ya existe. Revisá antes de continuar." }
git -C "$repo" worktree add --detach "$qa" origin/feature/e3-2a-imagenes-real-backend
git -C "$qa" log -1 --oneline
git -C "$repo" status -sb
```

**Docker Preparation:**
- The volume of data must be NEW and isolated by means of `-p pyme-e32a-qa` (do not reuse `asistente-pyme-e2`).
- Reserve a free port, for example `55439`, other than the port of the main base `55432` and the PostgreSQL Windows `5432`Confirm that there is no listening service before you start.
- Copy **Locally**, without displaying its content or uploading it, password settings `plataforma-pyme/.env` existing to the worktree QA. The file is ignored by Git. If it does not exist, create a private password following `.env.example` And not share it.
- From `$qa\plataforma-pyme`with Docker Desktop started, select the port and create a separate instance:

```powershell
$qaPyme = Join-Path $qa "plataforma-pyme"
if (Get-NetTCPConnection -LocalPort 55439 -State Listen -ErrorAction SilentlyContinue) {
    throw "Puerto 55439 ocupado. Elegí otro libre."
}
if (!(Test-Path -LiteralPath "$qaPyme\.env")) {
    Copy-Item -LiteralPath "$repo\plataforma-pyme\.env" -Destination "$qaPyme\.env" -ErrorAction Stop
}
Push-Location "$qaPyme"
$env:POSTGRES_HOST_PORT = "55439"
docker compose -p pyme-e32a-qa config --quiet
docker compose -p pyme-e32a-qa up -d db
docker compose -p pyme-e32a-qa ps
Pop-Location
```

**QA backend — second terminal**. Confirm that `/ready` be healthy and that the `alembic current` sea `e32a_photo_assets (head)`. Do not execute if the connection is suspected to point to another base:
```powershell
$qaBackend = Join-Path $qa "plataforma-pyme\backend"
Set-Location "$qaBackend"
$env:POSTGRES_HOST_PORT = "55439"
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "55439"
$env:DB_USER = "pyme"
$env:DB_NAME = "asistente_pyme"
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
# Solo después de verificar Docker y la conexión aislada anterior:
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 18081
```

**Frontend of the QA — third terminal:**
```powershell
$qaFrontend = Join-Path $qa "plataforma-pyme\frontend"
Set-Location "$qaFrontend"
$env:PYME_API_PROXY_TARGET = "http://127.0.0.1:18081"
npm.cmd ci
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1 --port 5175 --strictPort
```
Open `http://127.0.0.1:5175/real/login`. Do not activate REAL sales or modify the usual usage base. Verify that proxy sends to `18081` and that `/ready` in that API corresponds to the QA instance. React server itself DOES NOT save photos: it requires FastAPI + PostgreSQL migrated.

## 1. Manual cases of acceptance

Each case must record: **Approved / Failed / Observation / Capture**. Try first with new account of holder, new company and test data (do not use sensitive personal photographs). Do not compare with DEMO cards as a real source.

| ID | Section | Action in IU | Expected outcome |
|---|---|---|---|
| M01 | Profile | Load JPG, then transparent PNG and replace | One persistent photo, avatar updated, transparency preserved |
| M02 | Profile | Logout, Log In and Consult Profile | PostgreSQL persistence; no session or files in localStorage |
| M03 | Company | Load logo JPG/PNG/WebP | Visible image in Company Data and My Companies |
| M04 | Company | Replace logo and remove it | Logo changes without creating duplicates; removing it re-appears marker |
| M05 | Product | Create an article, upload 3 photos | You see 3 images in detail and the first one as a cover in catalog |
| M06 | Product | Add up to 8 photos and try a ninth | Interface warns limit; API does not support a ninth |
| M07 | Product | Remove the cover and add a new photo | Updated gallery; observe new selection of cover by position |
| M08 | Service | Create service without inventory, upload 2 photos | Pictures loaded without initializing stock or altering sales |
| M09 | Supplier | Create provider, load optional photo | Visible photo on file and in list; without affecting purchases |
| M10 | Supplier | Replace and remove your photo | Updated and commercial registration remains intact |
| M11 | POS | Open Photographed Goods and Services | Right covers inside each card; don't create a sale |
| M12 | Roles | Access as an active worker | You can see company/catalog/supplier photos, no upload or delete button |
| M13 | Tenants | Switching between two different companies | No images of the other company without membership are seen or edited |
| M14 | Security | Try uploading SVG, fake file and file >5 MB | comprehensible error; not saved or displayed as valid image |
| M15 | Persistence | Navigate to another screen and return | Saved image is viewed, without depending on DEMO status |
| M16 | Mobile | Adjust window to 390×844 and travel M01/M03/M05/M09/M11 | Readable cards, accessible and horizontally unmoved controls |
| M17 | Accessibility | Navigate with Tab, Use Selector and Remove Photo | Visible focus, identifiable titles and errors |
| M18 | Fallo de red | Simulate loss of connection during loading and reconsultation | The IU does not automatically re-up and allows verification of status |

**Evidencia sugerida:** profile capture, company with logo, gallery of 3 and 8 photos, supplier with photo, POS card with cover, mobile 390 px and example worker's permission.

## 2. Exit criteria

To declare E3-2A approved: green current CI; `alembic check` green in isolated DB; M01–M18 approved or documented deviations and resolved according to severity; no loss of isolation, no accidental commercial writing; user explicit approval for merit. DEMO mode and the rest of E3-1 should remain operational.

**Closure:** no fusionar a `main` in this guide. Worktree's later cleaning is done only when the user confirms that he or she no longer needs his or her QA files and backups. Never run `git worktree remove --force` as a first option.

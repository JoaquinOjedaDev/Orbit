# E2-5 — Secure playback guide, without deleting QA data

**Destination:** Windows PowerShell, repositorio `Orbit`folder `plataforma-pyme/`. Proposed **QA data tests new**, never rewrite purchases/receptions/adjustments whose IDs appear in this closure.

## 1. Pre-checking of the code and base

```powershell
git fetch origin
# Hacer checkout del SHA de código que efectivamente se audita en CLON AISLADO:
git switch --detach 748e69319d8d04900c009d5184168a264a9deeac
git rev-parse HEAD
cd backend
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
cd ..
docker compose --profile api up -d --build --wait api
Invoke-RestMethod http://127.0.0.1:18000/ready
```

This block must be executed in **an isolated audit clone**, not in the workspace with developer changes; `--detach` is intended to freeze the functional review. `HEAD` match the commit you want to review (in this package: `748e69319d8d04900c009d5184168a264a9deeac`) In a subsequent review, fix the **new SHA** si `main` progressed and declared the difference. The current migration expected is `e25a_inventory_ops (head)`, without pending operations; DB/API `healthy`, `/ready` = `ready/ok`.

**No ejecutar** `down`, `-v`, `TRUNCATE`, `DROP`, `DELETE` global, `alembic downgrade`, `stamp` no restorations that alter commercial data. Before applying any new migration, review the sequence and have a backup work when applicable. In the last Windows shutdown it was not necessary `upgrade head` Because I was already mirated.

## 2. Automated Suite with Separation of Responsibility

En `plataforma-pyme/`:

```powershell
cd backend
$env:RUN_DB_INTEGRATION = "1"
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Remove-Item Env:\RUN_DB_INTEGRATION -ErrorAction SilentlyContinue
}
cd ..
```

**Comment:** This flag enables testing against PostgreSQL. **Doesn't mean the DB is physically isolated.** Confirm the settings before running against a shared/real environment. In this cut the developer reported **840 passed in 110.89s**. Do not promise that the same count will continue if in `main` se agregan tests.

## 3. Secure Authentication in Swagger

Open `http://127.0.0.1:18000/docs`. Authenticate by `POST /api/v1/auth/login`Take the token. **only within the local session** and authorize Swagger with the lock. Confirm with `GET /api/v1/auth/me` (200). **Do not copy from Swagger the block `curl` to a conversation or report**: may contain a usable Bearer token. Send only **Server response** healed.

To repeat idempotency scenarios, use a new key created locally by testing:

```powershell
(New-Guid).Guid
```

Keeping its value **out of the report**, in a local temporary place during exercise. For replay use exactly **the same key and the same body**; for an attempt of second different operation use **other key**. Do not include the value in Git, ZIP or catch.

## 4. Clean test scenario B

1. Crear un **new article** physical `REVENTA` with unique QA SKU; do not reuse the ART-A item from the closure.
2. Create two active locations `can_store=true` or reuse QA locations only if the scenario requires it and historical items are not touched.
3. Register a purchase of 10 units of that new item. `quantity_milli=10000`, monetary cost in cents. The purchase record must answer `201` y **no** generate stock until received.
4. Confirm explicit reception at source; observe `COMPRA_RECEPCION +10000` and source balance version 1.
5. Transfer 4 units to destination: **201**Two moves. `-4000` y `+4000`. Consult balances: `6000` at source, `4000` in destination.
6. Repeat the **same request** y clave: **200**, same voucher and movements; GET of unchanged balances.
7. Try transferring 7 units from the source with another key: **409**, no change in balances or ledger.
8. Check for GET movements filtering through the new article: exactly one reception and two transfer moves; add +10000.

**Input Control:** for `UNIDAD`, `quantity_milli=1` must refuse purchase with **422**, because it does not represent an integer of units; Swagger's automatic JSON example does not replace the actual case values.

## 5. Clean test scenario C

1. Create **other** new article, physical and no previous balances.
2. Check that `GET /inventory/balances?catalog_item_id=...` is empty for the new article. **Do not confuse empty list with zero recorded balance.**
3. `POST /inventory/adjustments` con `kind=STOCK_INICIAL`, suitable location, `quantity_milli=5000`, `expected_version=0`Wait, I'm counting. **201** y `STOCK_INICIAL +5000`.
4. Repeat same key/body: **200**, same voucher. New initial stock key on the same pair: **409**.
5. Send `AJUSTE_ENTRADA`, `quantity_milli=2000`, `expected_version=1`, motive; wait **201**.
6. Send `AJUSTE_SALIDA`, `quantity_milli=1000`, `expected_version=2`, motive; wait **201**.
7. Trying to get out of 7 units, `expected_version=3`: **409** by insufficient stock.
8. Try 1 unit input with `expected_version=1` already obsolete: **409** by old version.
9. • BET balances: 6000 thousandths, version 3. • GET movements: 3 signed records, net +6000.

The appeal `GET /inventory/adjustments/{adjustment_id}` allows checking the historical proof of each operation **sin mutar stock**.

## 6. Documentary and ZIP verification

- Read `00_LEEME.md` first and cases B/C next to the QA table.
- Do not execute POST requests directly against historical IDs of `07_FICHA_QA_SANITIZADA.md`: these data are preserved as evidence.
- In this version **versioned in Git**, check each file with `git hash-object -- <ruta>` and contrast the OID with `12_MANIFIESTO_GIT_BLOBS.md`; check the SHA of the commit branch/PR. The old manifest `12_MANIFIESTO_SHA256.txt` corresponded to ZIP v1.0 **and not for revision v1.1**. In the face of subsequent changes, regenerate the IDOs from the manifest at the end.
- If the reviewer works with another version of the repository, log **new SHA** in its report; never attribute IC results to it from a different version.

## 7. What this guide does not allow us to infer

It does not authorize production, external access, publication of credentials, destructive testing, data deletion or migration change. It does not replace the independent audit protocol or its limited editing permissions.

## Additional recommended reproduction — 409 legitimate by attendance

1. En **isolated environment**, create physical article, two STORE locations and destination balance with known version. Read Balances GET; register quantity and version.
2. From another standalone session, execute an incoming transfer confirming and increasing the version of the target balance.
3. Try `AJUSTE_ENTRADA` with the version read before transfer and **new UUID4 key**: wait **409 by obsolete version**without operation or partial movement.
4. Reread balance and version, decide whether the reason/difference persists and **Only then.**, with new key, run the adjustment with the current version; confirm leader and balance.
5. For a real simultaneous race, use a two-connect HTTP/PostgreSQL barrier Harness and capture both results; do not simulate congruence with two sequential calls. **This cross race is proposed future test, not performed during the closing.**

A stock at zero after previous moves **no** admite `STOCK_INICIAL`; use new purchase/transfer or positive adjustment with current version. Never “fix” the conflict by changing keys or blind versions, disabling restrictions or deleting QA data.

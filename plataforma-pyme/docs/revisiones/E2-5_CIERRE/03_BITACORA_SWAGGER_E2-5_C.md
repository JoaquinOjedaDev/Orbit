# E2-5 C — Manual QA log in Swagger (initial stock and adjustments)

**Origin:** HTTP responses provided by the developer in this conversation, 09/11/2026. Not an independent execution. **Completely** passwords, tokens, idempotency keys and connection credentials.

**Scenario:** same company QA and location House, but **other physical article**: `Galletitas QA Stock Inicial`. It avoids altering the stock of article A of E2-5 B.

## 1. Observed cases

| ID | Action in Swagger | Observed HTTP | Verified result |
|---|---|---|---|
| C-01 | `POST /catalog` Article B, `REVENTA` y `UNIDAD` | **201** | Active item, no previously reported stock. |
| C-02 | First attempt `POST /inventory/adjustments`, type `STOCK_INICIAL` | **401** | `Credenciales invalidas o sesion vencida`; el `curl` I didn't have a Bearer header. **No** created operation. |
| C-03 | Swagger was reauthorized; `STOCK_INICIAL`, `quantity_milli=5000`, `expected_version=0` en Casa | **201** | Operation with motion `STOCK_INICIAL +5000`, actor and motive persisting. |
| C-04 | Repeat C-03 with **Same** unpublished body and key | **200** | Same ID of operation, movement and timestamp; no second initialization occurred. |
| C-05 | Another request `STOCK_INICIAL` for the same article+House pair, with key **new** unpublished | **409** | `Stock inicial ya establecido en esta ubicacion y articulo`. |
| C-06 | `AJUSTE_ENTRADA +2000`, `expected_version=1`, surplus ground | **201** | Movement `AJUSTE_ENTRADA +2000`, new proof. Expected balance 7000, version 2. |
| C-07 | `AJUSTE_SALIDA -1000`, `expected_version=2`, damaged unit reason | **201** | Movement `AJUSTE_SALIDA -1000`, new proof. 6000 expected balance, version 3. |
| C-08 | `AJUSTE_SALIDA -7000`, `expected_version=3` | **409** | `Stock insuficiente para ajuste de salida`; operation rejected. |
| C-09 | `AJUSTE_ENTRADA +1000`, **`expected_version=1` obsolete** | **409** | `Version de saldo obsoleta o saldo inexistente`; operation rejected. |
| C-10 | `GET /inventory/balances?catalog_item_id=...` | **200** | **One row** Home: `quantity_milli=6000`, `version=3`; `updated_at=2026-11-09T12:50:22.511667Z`. |
| C-11 | `GET /inventory/movements?catalog_item_id=...` | **200** | **Three rows:** `AJUSTE_SALIDA -1000`, `AJUSTE_ENTRADA +2000`, `STOCK_INICIAL +5000`. No rows for C-08/C-09. |

## 2. Calculations and conclusions

`+5000 + 2000 - 1000 = +6000` thousandths = **6 units**. The result is exactly consistent with the confirmed balance sheet. Successful operations progressively raised version to 3; the two subsequent rejections **no** They increased it. `updated_at` the balance matches the last successful adjustment, not subsequent rejections.

- A second initialization for an already used article/location is rejected even if the key is new (C-05).
- The replay of the first initialization works (C-04), without contradiction to the C-05 rejection.
- The deltas were registered with the sign corresponding to each type and with the same business actor.
- Invalid C-02 session is an over-authentication control **after** reauthorization; it should not be attributed to a stock logic defect.
- C-08 and C-09 requests do not appear in the referenced leader. No compensation is invented.

## 3. Contrast voucher identifiers (not credentials)

| Type | Operation ID | Motion ID |
|---|---|---|
| Initial | `c23fb5f0-7a14-43cf-98ba-d572e79a1bdd` | `05ef4bad-0e3f-4fb9-aa83-19fe87ab0c6f` |
| Input adjustment | `bd324719-52b7-44ee-a4c3-17d1ace2a04d` | `7f687888-4dbd-46cf-8487-6b1a1f081946` |
| Output setting | `2caf25a3-966c-450e-8527-58ae95679ce9` | `7e6c887d-4241-4b53-807d-ad5a2c8be6b8` |

## 4. Safety and limit of inference

In the conversation, a `curl` con un token Bearer. **Its value is not copied into the documentation.** Subsequently provided `POST /api/v1/auth/logout` con **204 No Content** (09/11/2026 15:23:37 GMT) using the **same token**This evidence **SWAGGER-REPORTED** allows for the termination of that specific session according to the contract implemented; does not certify an SQL inventory of all sessions in the account. Do not share again the `curl` Swagger. Test C-11 uses only the filter for item B; it does not certify current balances of all other items at a later time.

## 5. The not tested manually

The client/user simultaneities about a version or initialization and the minor role permissions are covered in CI/test suite, not in this manual Swagger. The rule "no initial stock if there was any previous history, even zero balance" has automated tests; **no** was manually reproduced with zero exhaustion.
# E3-2A — Technical audit prior to manual QA

**Scope:** PR #65 of private real photos about `main` E3-1; static validation of architecture, contracts, DB, authorization, storage, frontend and tests.
**Result of the code analysis:** complete functional implementation, with reinforced security controls; visual manual QA **still outstanding**.
**Evidence from the latest HEAD of audited code:** `67ef91950f61ed47509608db70e5db4a281dfaa5`, 12/11/2026, 3/3 workflows aprobados: Backend FastAPI, Frontend, full-stack PostgreSQL + Chromium. En full-stack: **908/908 pruebas backend**, **54/54 REAL routes**, **6/6 DEMO**; `e32a_photo_assets (head)`, `alembic check` no difference. Backend Python 3.12 and 3.14, build/lint/frontend and Docker approved.

**Final technical opinion:** suitable for starting **QA manual for use and design** There were no outstanding evidence errors or blocking findings in the code review. **It's not equivalent to visual approval.**, productive deployment or merge authorization; the evolutionary risks of section 6 remain open.

## 1. Requirements and traceability

| Requirement | Evidence of code | Status |
|---|---|---|
| 1 personal photo | `PhotoService.upload` (single slot), `RealAuthApp`, `RealPhotoManager` | Implemented |
| 1 company photo | `/photos/businesses/{id}`, `RealBusinessesPage` | Implemented |
| Multiple article/service photos | 8 slots (0–7), `RealCatalogPage`, `RealPhotoPreview` | Implemented |
| 1 optional photo supplier | `/photos/businesses/{id}/suppliers/{id}`, `RealSuppliersPage` | Implemented |
| Cover page in POS | `RealPosPage` + first photo of the catalogue | Implemented |
| Without breaking stock, cash or payments | Additive model and API, without mutating trade tokens | Revised by code; required CI E2E |

## 2. Security, privacy and tenants

- All image reading and writing requires real Bearer. Profile photos limited to the authenticated user. Active members can view business photos; only holder/manager can write in active company.
- Se resuelve `business_id` and it is verified existence and belonging of the resource catalogue/supplier; foreign actor receives 404 without access to bytes.
- The download checks permissions before selecting the BYTEA column; POST performs advance authorization control before decoding bytes and **revalidated under lock** when saving (mitigation abuse and TOCTOU). DELETE revalidates under lock.
- `PhotoAsset` limits slots, size, MIME and dimension with CHECKs and UNIQUE in PostgreSQL. A single photo replacement is confirmed or reversed atomically.
- JPEG/PNG/WebP statics are decoded and normalized to WebP without EXIF, with 5 MiB/12 MP/1280 px protection and PNG transparency preserved. SVG, animated GIF or external URL import is not supported.
- React views download blobs with Bearer header in memory. They do not store photos or credentials in localStorage or insert token into URL. They revoke objects URLs when unmounting.
- Pallow CPU and POST SQL scripts run outside of the event loop; the backend continues to use actual PostgreSQL, not saved in browser memory.

## 3. Migration and consistency

- `e32a_photo_assets` incorporates `photo_assets` after `e26a_sales_foundation`; the other tables remain intact. `alembic check` IC must confirm identity with SQLAlchemy.
- `get_content` has two-phase reading (ACL, then BYTEA); photos are not displayed as a public static directory.
- Reverse migration with photo data is expressly blocked to prevent accidental loss.
- PostgreSQL tests must create data within ephemeral DB and/or revertible external transaction.

## 4. Compatibility and automatic testing

- Backend: standardization, invalid formats, transparency, authentication, substitution, eight positions, deletion, permissions, reading between tenants and worker access.
- Frontend: URL/token contract, upload FormData, size/MIME validation, HTTP errors, metadata parseo, preview, states.
- E2E REAL Playwright: profile with replacement, company with logo, gallery services, supplier with deleted, POS cover image; 390px screen; DEMO regression and previous features.
- No migration or manual testing was performed on the user's personal local base.

## 5. Audit findings corrected in the branch

| Priority | Finding detected | Corrigendum |
|---|---|---|
| High (performance) | Pallow decoding of images in functions async blocked the event loop | `run_in_threadpool` during conversion |
| Average (performance/privacy) | Accessing the resource by UUID loaded BYTEA before confirming ACL | Selective reading of metadata and, after authorisation, bytes |
| Average (abuse) | Unauthorized POST first processed the image | Advance authorisation and revalidation when saving |
| Average (performance) | Operaciones DB de carga dentro de handlers async | SQL de POST movido a threadpool |
| Average (UX) | Photo partially loaded could leave local cover outdated | Callback review and consultation after uncertain response |
| Average (QA) | Old test tied HEAD Alembic to the sales cut | Real HEAD Dynamic Test |
| Average (QA) | Company selectors could match hidden options | Playwright identifica la tarjeta; POS usa scrollIntoView |

## 6. Non-blocking observations and future debt

| Severity | Observation | Recommendation |
|---|---|---|
| Average | `owner_id` is polymorphic and does not have specific FK to user/catalogue/supplier. Physical chip deletions do not exist today; in the future it may require cleaning of orphan images. | If physical casualties are incorporated, create a verified cascade or transactional cleaning policy |
| Average | Listings covers and POS are consulted with a GET per visible resource; with hundreds of cards there would be multiple queries of metadata and bytes. | Measure in QA and study endpoint of covers in separate batch/miniatures |
| Average | Catalog photo POST does not carry explicit idempotence key. After timeout the user could manually repeat and generate duplicate photo. The UI does not automatically retry. | Analyze idempower/reconciliation key if volume increases |
| Average | BYTEA in PostgreSQL is correct for the prototype but increases backups and storage cost. | In high volume production, migrate to private object pocket and maintain metadata/ACL |
| Low | No main photo clipping or manual selection/gallery rearrangement. | Decide after usability QA, without blocking MVP |
| Low | HEIC/HEIF not accepted by the first contract. | Evaluate safe conversion at a future stage |
| Average | No specific limit rate or external service antimalware scanning was included; formatting is redecorated and restricted. | Before exposing charges to the Internet, check perimeter controls and quotas per tenant |

## 7. Verdict and door of acceptance

**Suitable for manual testing only if final IC ends completely green**, without unit testing/integration failures, migration, frontend, REAL navigation and DEMO regression. The observations in section 6 do not require refactoring the module for MVP but should be kept visible on backlog. Validate on Windows with separate QA base and tests `E3-2A_GUIA_QA_MANUAL_WINDOWS.md`.

**No authorization to merge a main** until the user reviews the screens, validates M01–M18 and explicitly approves.

# E3-2A — REAL Images: Profile, Company, Catalog and Suppliers

**Status:** increase in PR #65 (DRAFT) over `main`. Do not enable in the local PostgreSQL without prior approval and backup.  
**Date:** 12/11/2026.  
**Scope:** Private and own photos for user identity, tenant and catalog; without changing inventory, box, sales or payments.

## Functional rules

| Recourse | Quantity | Who can load/take | Who can see |
| --- | --- | --- | --- |
| Personal profile | 1 | The holder of the authenticated session | Only the holder |
| Company | 1 | Administrative holder or Administrator in an Active Company | Active members of the company |
| Catalogue of goods and services | Up to 8 per tab | Administrative holder or Administrator in an Active Company | Active members of the company |
| Supplier | 1 optional | Administrative holder or Administrator in an Active Company | Active members of the company |

Services admit gallery as well as goods, but **Never** The first photo of the catalogue by the manufacturer is to be created first and then photographed from its file. `position` is the cover that is displayed on cards and POS. Any user with permission to consult can see it. Stock, prices and commercial permits do not change.

## Persistence and contract

New migration: `e32a_photo_assets`, posterior a `e26a_sales_foundation`, aditiva. Tabla `photo_assets`: `id`, `owner_type`, `owner_id`, `business_id` (NULL for PROFILE only), `position`, `width`, `height`, `byte_size`, `mime_type`, `content` (BYTEA), `created_at`.

PostgreSQL is used to allow photos to survive the restarts of FastAPI, containers and machines without an arbitrary local directory. **Trade-off:** PostgreSQL backups will include photos and grow as per use. For bulk production, migrate blobs to a private object store with access control, preserving UUID and metadata. The photos are not part of the React bundle or Git folder.

API (always with Bearer):
- `GET /api/v1/photos/me`, `POST /api/v1/photos/me`.
- `GET/POST /api/v1/photos/businesses/{business_id}`.
- `GET/POST /api/v1/photos/businesses/{business_id}/catalog/{item_id}`.
- `GET/POST /api/v1/photos/businesses/{business_id}/suppliers/{supplier_id}`.
- `GET /api/v1/photos/{photo_id}/content`, `DELETE /api/v1/photos/{photo_id}`.

POST uses `multipart/form-data` with a file `file`. Get collections return metadata **no bytes**and the binaries are downloaded by an authenticated GET, with `Cache-Control: private, no-store` y `nosniff`. Bytes are not accessible by public URL and are not injected into `img src` with token; React does `fetch` with Bearer only in memory, creates a `blob:` Transitional URL and revokes it when unmounting.

## Safety and validation

- JPEG/PNG/WebP **static** only; SVG (XSS) is not accepted, animated GIF or external link loading.
- Maximum 5 MiB file received, 12 million pixels input, 1280 px edge after adapting and 2 MiB stored.
- The backend verifies that the image **can actually decode**; ignore extension, name and heads to trust content. Normalize static WebP to remove EXIF metadata and reduce weight; re-escalate without losing proportions.
- UUID of each resource is validated and verified in PostgreSQL. Reading requires active membership of the company. Deeds require an ACTIVA + role Owner/Manager; there is no confidence in UI controls.
- GET readings do not write. Replace single photo deletes the previous one and creates new one in the **same transaction**. The single index protects gallery slots. There are no automatic retryings after an uncertain response: the IU updates the list before suggesting another attempt.
- It is allowed to delete a photo without deleting an article sheet or losing historical movements.

## UX flow

1. Log in REAL.
2. **My profile** → Profile photo, select a JPG/PNG/WebP. Previewed on the tab and in the profile header.
3. **My company** → Photo or logo; shown in the list of companies and in Company Data.
4. **Catalog** → Create article or service, open "View tab" → Photos, up to 8. The first photo appears on the card and POS. In list view images are consulted only when your cards enter the viewport.
5. **Suppliers** → Create provider, open "View tab" → Optional photo. It also appears on the list card.
6. To remove, use "Remove Photo" and confirm. Users without permission can only view the available images.

The device camera can be used by browser selector when returning JPG/PNG/WebP; HEIC/HEIF, manual trimming, arbitrary gallery order and public showcase photos are not part of this first increment.

## QA required before integration

- `python -m alembic upgrade head` **only in PostgreSQL disposable** en CI/QA y `python -m alembic check` No difference.
- Python 3.12 and 3.14: complete pytest, invalid/extra large photo test, HEAD migration, catalog with eight photos, replacement, user/company access, member with read only, authenticated binary download.
- Frontend: `npm ci`, `npm run build`, `npm run lint`, `npm run test:auth` and regression of the entire suite.
- Playwright E2E REAL en `PYME_DISPOSABLE_QA=1`: profile, photo company, multiple service photos, supplier and miniature POS on ephemeral basis.
- Manual QA: 1366 px desktop and 390 px mobile; photo selection and replacement, worker account permission, access after browsing, pictureless status and display of chips with 8 images. Do not run POST on a personal or productive base.

## Phase-by-step units and boundaries

They're incorporated. `Pillow` y `python-multipart` The endpoints do not alter DTO sales, stock, payments, catalogs or suppliers; the new resource is additive and optional. DEMO files are not changed. The integrable version requires green suites and visual user approval. The PR remains DRAFT until that time.

# E1-B10 — Local images per sheet

**Status:** changes published in `main`. Pending: `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run test:images` and visual validation of the equipment.

## Objective

Attending user observation: it was not possible to select images for articles/services, providers, personal profile and locations. A business logo or commercial image is also enabled. The original editing flow is preserved, regardless of the reference HTML images, without uploading photos to a backend and without storing complete originals in `localStorage`.

## Scope

- **Catalogue:** en `Editar` an existing tab appears "Article or Service Image" with selector, replacement and deletion. The card and "View Tab" show the image if it is saved; otherwise they keep the icon by type. For a new tab, the article is first recorded and then opened "Edit".
- **Suppliers:** the same from "Edit provider", photo in directory and tab.
- **Locations:** The same from "Edit Location"; cover photo on your card. Maps links are independent of images.
- **Company data:** logo or commercial image on the tab, personal start and general business panel; if it is not loaded, your initials appear.
- **My profile:** Optional photo, replacement and removal. It is displayed on the personal tab, in the profile avatar and in the top bar avatar. Initials are maintained as an alternative, not confused with the job charge per company.
- **Status of the tab:** select/delete a save image **immediately** and independently to "Save changes" from other fields. "Cancel editing" does not undo the photo if it has already been loaded; the selector reports that behavior.

## Technical architecture

- `src/data/demo/imagePolicy.ts`: identity keys and pure validations.
- `src/data/demo/imageStorage.ts`: blobs optimized in **IndexedDB** of the web origin (`asistente-pyme-demo-images`object `images`). Asynchronous CRUD with notification of changes using a window event and URLs `blob:` revocable.
- `src/features/common/DemoPhoto.tsx`: Reusable selector and thumbnail component `DemoPhoto`, without dependence on the domain.
- The keys are serialized tuples of **[tipo, businessId, entityId]** for company/articulate/supplier/location; profile is unique `['profile', 'demo-user']`. The same file of different companies **does not share photo**.
- Only accepted **JPG, PNG y WebP**, up to 8 MB original. The image is decoded and reduced while preserving appearance to a maximum of **512 px per side**, is converted to WebP and the optimized blob (up to 400 KB) is validated. SVG, animated GIF, PDFs or external URLs are not supported as an image.
- The photo is preserved **only in that browser and origin**, not in GitHub, not in operating system storage, not on the server and not on backup of `localStorage`. Permits and isolation are only local UX.
- Clave `localStorage` existing **unmodified**: `asistente-pyme.e1a2.demo.v1`. Image changes do not mutate `DemoSnapshot`Catalog, shopping or the inventory ledger.
- If the browser blocks IndexedDB or reaches its quota, it displays an error and the text tab continues to work. No photos are promised between devices, persistence after deleting site data, nor collaboration functions.
- A new record must exist in advance to form the image key. It avoids linking an image with a draft without ID. There is no definitive deletion of tokens in this DEMO; future cleaning of orphaned blobs and storage on the backend remain pending.

## Commands to verify in Windows

From `plataforma-pyme/frontend`:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:images
npm.cmd run test:catalog
npm.cmd run test:suppliers
npm.cmd run test:inventory
npm.cmd run dev
~~~

## Manual testing

| Code | Case | Expected |
|---|---|---|
| IMG-01 | Catalog → existing article → Edit → Choose image JPG | Preview and card show photo; "See tab" also |
| IMG-02 | Replace JPG with PNG or WebP | Updates image without duplicated tiles |
| IMG-03 | Remove Photo | Re-appears default icon and does not change trade sheet |
| IMG-04 | Suppliers → Edit → Choose photo | Directory and detail show image |
| IMG-05 | Locations → Edit → Choose photo | Your card shows the photo |
| IMG-06 | My profile → Choose photo | Appears in profile and top avatar; initials remain available when removed |
| IMG-07 | Recargar F5, navegar y volver | Photo remains in same browser |
| IMG-08 | Choose SVG, GIF or greater file at 8 MB | Validation message, no invalid image |
| IMG-09 | Switch between WALOS and another company with items/suppliers of the same name | Photo is not shared between entities/enterprises |
| IMG-10 | Buy/receive, move stock and save catalog after upload photo | No balance or movement changes for a photo |
| IMG-11 | Create new article/supplier/location | First saves the tab, then allows associate photo from Edit |
| IMG-12 | Narrow screen | Selector, buttons and thumbnails still workable |
| IMG-13 | Hide/delete site data in browser | Warnings are that photos may also be lost; sync is not promised |

| IMG-14 | Company Data → choose logo | Shown in business sheet, panel and personal start; not shown in another business |

## Earrings for production and TP3

Migrate to secure storage of objects with authentication, real authorization by company, limits/quotas per tenant, validation server-side format and content, deletion with deleted entity, signed access URLs, backups and proof of attendance. Do not use actual personal photos for local demo testing.

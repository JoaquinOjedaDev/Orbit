# E3-2A — Post-test general audit and corrections

**Date:** November 12, 2026.  
**Project:** Orbit, multi-company/multi-rub generalist platform, UNSAM Programming 2. WALOS is not the product.  
**Unaltered base:** main en 0f1b1ca569605e18f9207520f1d4e0e5a563688e.  
**Functional branch audited:** feature/e3-2a-images-real-backend, last functional commit validated c60a0eb21ef764c03af9795744a1ebabdb811849. PR #65 in DRAFT.  
**Scope:** cross-sectional integration and regression audit of E3-2A with identity, companies, equipment, catalog, suppliers, purchases, inventory, POS, IC and closure documentation E2-7/T12. **Not equivalent** a pentest, production certification, comprehensive audit of each line or final approval of the design.

## 1. Executive summary

The functionality of manually tested photographs is operational and isolated by company. User findings were concentrated on the location of controls and screens where the thumbnail was not integrated. They were corrected over the PR branch, without any merit or changes to the local base.

**Post-regression technical opinion: APPOINTMENT FOR VISITIONAL REVIEW OF CORRECTIONS.** The three workflows of the last code commit were approved; human approval of UX changes and manual tests suspended by user decision is not required. No merge authorization exists.

## 2. Results of QA manual declared by the user

| Group | Manual result recorded |
|---|---|
| M01 and M02 — Profile: load, replacement, avatar, F5 and login | Approved by the user |
| M03 and M04 — Company: logo, replacement and disposal | User-approved; detected flow out of Edit |
| M05 — Catalogue: three photographs, cover, persistence | Works; observation on high/editing |
| M06 and M07 — Eight photos, rejection of ninth, hollows and cover | Approved by the user |
| M08 — Services with unstocked photos | Approved by the user |
| M09 and M10 — Suppliers: photo, replacement, deleted | User-approved; upgrade/editing |
| M11 — Cover visible on POS | Approved with capture; detected missing in Purchases, Stocks and final review |
| M12 — Reading per employee and absence of editing controls | User-approved; capture showed Maintainer, backend also checks Worker |
| M13 — Separation between two undertakings | Approved by the user |
| M14 — Invalid file, SVG, >5 MB | **Not executed**: only two local archives were prepared |
| M15–M18 — Additional navigation, mobile, accessibility, network failure | **Not executed** by the user’s decision |

These are user testing statements, not independent browser execution on your machine. Changes after those screenshots still require visual acceptance.

## 3. Corrections implemented in the branch

| Area | Corrigendum | Invariant preserved |
|---|---|---|
| Creation of articles and services | Selector of up to 8 optional photos during discharge; first the REAL tab is created and then uploaded to the returned ID | Orphan photos are never deliberately generated; no stock or sale is created |
| Catalogue edition | Image Manager also accessible from Edit | Gallery maintained in See original tab and writing permission |
| Creation and editing of suppliers | Optional photo selection during discharge; manager in Edit | Photo is not mandatory and does not affect purchases or promotions |
| Enterprise Edition | Change the integrated logo in Edit data; out of editing, display only | The backend continues to demand business.profile.edit |
| Shopping and receptions, list | Visual miniature by line linked to catalog | The amount, description and quantity remain immutable snapshots |
| Inventory, Stocks | Visual cover of the catalogue sheet | The balance, its version and the ledger are exclusively PostgreSQL |
| POS, final review | Current cover as reference in each row | Does not modify totals, discounts, payments or sales rating policy |
| Equipment | Avatar staff by dedicated route of consultation, authenticated and linked to company | No public resource, only members.read, target member ACTIVE, private data outside the token URL |
| Gallery Notices | Avoid keeping a successful notice when trying to exceed eight photos | No change in authorisation or storage |
| CI platform PyME | Platform workflows set to ubuntu-24.04 | Evita incompatibilidad Playwright/Chromium con runner ubuntu26.04; WALOS CI no se modifica |
| QA | Playwright case expanded to high image selection and editing | Never activates sales or uses base not disposable |

If uploading photos fails **after** to create an item or supplier, the trade sheet remains created; warning is displayed and the operator must inspect the gallery before attempting again. There is no distributed transaction that will turn the creation of the article atomic and all its photo POSTs. This limit is explicit, it does not simulate commercial rollback.

## 4. Security and isolation audit

- Authentication using Bearer, real sessions; private images standardized to WebP. No URL is incorporated with token or localStorage photo storage.
- Writing operations verify active membership and editing permission in an ACTIVA company, before decoding, and recheck before saving. Worker and Maintainer roles do not get permission to hide or display buttons.
- Profile photos are still accessible by their owner via /photos/me; on Team there is route **read-only** for an active colleague of the same tenant, conditioned to permission members.read. External users and workers without reading equipment receive rejection without delivery of bytes.
- The front page queries of Purchases/Existences/POS use the business_id of the current context; the references in the catalog are validated against that tenant.
- Image of a product in historical proof: **current orientative photo**, not part of the immutable document. Accounting snapshots are not manipulated.
- Existing migration e32a_photo_assets, 21 tables verified in manual QA. Subsequent corrections do not add migrations or modify commercial model keys.
- The system limits real format, resolution and size before storage. M14 manual was left pending; previous unitary tests of invalid formats remain in the suite.

## 5. Comprehensive revision by subsystem

| Subsistema | Audit observation | State of evidence |
|---|---|---|
| Authentication and profile | Persistent own Avatar; REAL session in memory; F5 may require new authentication | M01–M02 manual + tests |
| Companies and memberships | ACL per tenant; visible logos and explicit editing; invitation does not grant access until accepted | M03–M04, M12–M13 + tests |
| Equipment | Avatar under read permission and for active members only; new endpoint requires regression | New tests; visual revalidation pending |
| Catalogue and suppliers | Persistent sheets and optional photos during discharge/edit | M05–M10 for previous flow; new UX pending revalidation |
| Purchases | Reference photo in list; no new commercial deed | JSX and IC revision; new pending screen |
| Receptions | No change in single reception contract, stock or voucher | Regression E2/E3 via CI |
| Inventory | Cover photo is not part of the balance calculation | IC-powered regression; new thumbnail pending visual approval |
| POS / Sales | Cover added under revision, without changing the sales command or calculations | M11 and IC; final visual pending review |
| Expenditure / Cash / Accounts / QR | REAL Capabilities are not added to E3-2A; DEMO or future according to T12 closure | They are not defects of the photographic increment |
| Academic documentation | T12 E2-7 retains RF-01 to RF-07 limits and distinguishes RF-08 from RF-10 | Revised against T12 Act; not new original record audit |

## 6. Risks and work to be done

**High priority for a public launch, not isolated prototype blocker:** review uploads/rate-limit, perimeter file scanning, access authorization between tenants in concurrent scenarios, avatar consent policy shared with equipment and support/restore BYTEA images.

**Average priority for product:** N+1 thumbnail requests in extensive listings, absence of photo idempotency-key in POST, manual selection and cover rearrangement, error UX after creation with partial load, session persistence, WCAG accessibility and physical phone display.

**Acceptance priority E3-2A:** complete the IC in the latest SHA, visually review the corrections made after M13 and decide if the prototype requires repeating M14–M18. Do not declare these tests performed. Do not enable REAL sales deeds or use real money/credentials for QA.

## 7. Evidence and status of IC

The pre-correction basis passed 908 Pytest, 54 Playwright REAL and 6 DEMO over the previous SHA of E3-2A. **It is historical evidence, not proof of this change.**

The first execution of the new commit detected a reproducible external problem: Playwright rejected Chromium in the runner ubuntu26.04-x64. The three unique YAMLs from PyME were fixed to ubuntu-24.04. Then the integral suite found two navigation regressions: article/supplier heights opening tab instead of returning to list. Return to listing was preserved and the new Playwright was corrected to open "View tab" explicitly.

**CI COMPLETE, approved on the last commit of code `c60a0eb21ef764c03af9795744a1ebabdb811849` (12/11/2026):**
- Backend FastAPI, Python 3.12/3.14 y Docker: **SUCCESS**.
- Frontend build/lint/tests/Chromium: **SUCCESS**.
- Fullstack PostgreSQL/Alembic/REAL/DEMO: **SUCCESS**; **908 Pytest aprobados, 54 Playwright REAL y 6 DEMO**; Alembic `e32a_photo_assets (head)`, `No new upgrade operations detected`.

This documentary update is subsequent to that code SHA; it should be verified that the workflows of the document commit also end before declaring final HEAD green. Automatic approval does not amount to visual conformity or authorize merge.

## 8. Closing doors

1. CI Backend Python 3.12 y 3.14 + PostgreSQL, imagen Docker, Alembic HEAD/check: **APPROVED under code c60a0eb2**; review again SHA final documentary.
2. CI frontend build, lint y tests del contrato: **APPROVED under code c60a0eb2**; review again SHA final documentary.
3. Full-stack Playwright REAL y DEMO en PostgreSQL descartable: **APPROVED under code c60a0eb2**; review again SHA final documentary.
4. Human review of new screens: article/supplier highs, editing, Shopping, Stocks, equipment and POS revision.
5. Explicit user approval before converting PR #65 to READY or merge to main.

**Status of this document:** cross-sectional audit performed with IC code completely approved; manual acceptance of the new screens pending. No change was made to the local user base and no authorization for merge.

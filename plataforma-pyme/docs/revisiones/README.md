# Block revisions — PyME Platform

This directory retains release sheets for review and block evidence. **Do not interpret a delivery sheet as an independent completed audit.** The reviewers work in their own branches without automatic merge.

| Block | Delivery Sheet | Evidence or status |
|---|---|---|
| E2-1 Identity/enterprises | [Delivery E2-1](E2-1_ENTREGA_PARA_REVISION.md) | External review according to sheet |
| E2-2 Locations | [Delivery E2-2](E2-2_ENTREGA_PARA_REVISION.md) | External review according to sheet |
| E2-3 Catalogue | [Delivery E2-3](E2-3_ENTREGA_PARA_REVISION.md) | External review according to sheet |
| **E2-4 Suppliers/Buyers/Reception** | [Delivery E2-4](E2-4_ENTREGA_PARA_REVISION.md) | [**Close E2-4 with QA log, IC and audit of observations**](E2-4_CIERRE/00_LEEME.md) |
| **E2-5 Inventory A-C** | [Specific audit sheet](E2-5_ENTREGA_PARA_REVISION.md) **prepared, not executed** | [**Closing documentary E2-5 v1.2 published, evidence and critical evaluation of external observations**](E2-5_CIERRE/00_LEEME.md) · PR #24 merged, independent audit pending |
| **E2-6 Integrated sales A-E** | [**Close E2-6 after merge**](E2-6_CIERRE/00_LEEME.md) | [Comprehensive technical memory](../E2-6_DOCUMENTACION_INTEGRAL.md) · PR #26 (model) and PR #27 (sales) merged; documented CI and Swagger; independent audit pending |

La [master guide](GUIA_MAESTRA_REVISION_BLOQUES_E2_ASISTENTE_PYME.md) sets scope, reading methodology, editing permissions and security rules.

**Cut E2-4:** `4f88416141c09a82e744990b1aee8c00b9f31dfd`, `e24e_receipt_stock`797/797 tests Windows and GitHub CI 3/3. Functional closure does not mean independent audit completed or system suitable for production.

**Functional cutting E2-5 (09/11/2026):** `main` `748e69319d8d04900c009d5184168a264a9deeac`, PR #21–#23 merged, Alembic `e25a_inventory_ops`, CI 816/826/840 tests per cut in Python 3.12 and 3.14, 840/840 Windows for E2-5 C. **This index links the documentary closure published in `main` to the SHA `c66df2f8ddaa8179ca12e342bd3099348bc6b155`** y [independent audit plan](E2-5_AUDITORIA/00_LEEME_Y_PRECONDICIONES.md), **prepared but not executed**. It does not amount to an external audit already carried out nor a certification of production. Observations from another AI verified [Here.](E2-5_CIERRE/13_EVALUACION_OBSERVACIONES_IA.md).

**Cut E2-6 (09/11/2026):** `main` `6336152e8dd095ca91363566beddd2b622432a5e`, PR #26–#27 merged; CI 42696474777 3/3; last local regression reported `879 passed`; [consolidated formal closure](E2-6_CIERRE/00_LEEME.md)It does not amount to an independent completed audit.

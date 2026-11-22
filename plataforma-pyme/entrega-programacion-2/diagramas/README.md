# UML diagrams — Current index T12 (11/11/2026)

**Functional status:** `main` `c6a77137cf82dcb9aad225645e84b1265b1da3ec` — T11. **Documentary status:** PlantUML and SVG 03A, 03B, 03C updated sources to reflect REAL RF-01..RF-07 operations; do not represent expenses/box/accounts/QR productive. Provider is REAL, as well as purchases, receptions, balances, transfers, adjustments and POS sales.

| Diagram | Explanation | Graphic for exposure | PlantUML Source |
|---|---|---|---|
| **03A — Identity and catalogue** | [Guide 03A v2.1](03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md) | [SVG 03A](03A_IDENTIDAD_EMPRESAS_CATALOGO_REDISENADO.svg) | [Source 03A](03A_CLASES_IDENTIDAD_Y_CATALOGO.puml) |
| **03B — Trade and inventory** | [Guide 03B v2.1](03B_EXPLICACION_COMPRAS_INVENTARIO_VENTAS.md) | [UML 03B](03B_COMERCIO_INVENTARIO_REDISENADO.svg) y [**second diagram: trade flow explained**](03B_FLUJO_COMERCIAL_EXPLICATIVO.svg) | [Source 03B](03B_CLASES_COMERCIO_E_INVENTARIO.puml) |
| **03C — Cases of use** | [Guide 03C v2.1](03C_EXPLICACION_CASOS_DE_USO.md) | [SVG 03C](03C_CASOS_DE_USO_REDISENADO.svg) | [Source 03C](03C_CASOS_DE_USO.puml) |

**Conventions:** el `.puml` represents conceptual entities/associations or actors/CU; the SVG is a **editorial composition for exhibition**, not a literal compilation of PlantUML. Notes, arrows and summary boxes in SVG **do not replace** Attributes, SQL Constraints or Server Role Validation. The guides explain deliberate differences. [Document 03](../03_MODELO_DE_DOMINIO_Y_UML.md) is the guiding model and the [Document 05](../05_MATRIZ_API_Y_TRAZABILIDAD.md) links operations to routes and evidence.

**Technical review:** The 3 PUML, 4 SVG and 3 guides have been proven. PlantUML engine compilation is an outstanding control when the executable is available, and must not be registered as a PASS without running it. RF-08..RF-10 are still DEMO/deferred.

---

## Historical archive of the E2-3 index (preserved for traceability purposes)

# Diagrams 03A, 03B and 03C — Orbit

**Status E2-3 E (08/11/2026):** identity, companies, equipment and invitations (E2-1), locations and assignments (E2-2), and Catalogue (E2-3) have real backend. **Supplier continues TO-BE**; purchases, stock and sales still do not consume the catalogue or operational policy of headquarters. The prints are representations of the model and do not replace server authorization.

El [Document 03](../03_MODELO_DE_DOMINIO_Y_UML.md) describes the complete model, states, transactions and restrictions. **detailed explanation in Markdown**, una **vector SVG sheet** for GitHub/presentation and a **PlantUML source** to review his semantics.

| Diagram | Explanation | Vector sheet | PlantUML Source |
|---|---|---|---|
| **03A — Identity and catalogue** | [Guide v0.7 E2-3 E](03A_EXPLICACION_IDENTIDAD_EMPRESAS_CATALOGO.md) | [Updated editorial SVG](03A_IDENTIDAD_EMPRESAS_CATALOGO_REDISENADO.svg) | [PUML issuer/acceptant](03A_CLASES_IDENTIDAD_Y_CATALOGO.puml) |
| **03B — Trade and inventory** | [Complete guide](03B_EXPLICACION_COMPRAS_INVENTARIO_VENTAS.md) | [SVG](03B_COMERCIO_INVENTARIO_REDISENADO.svg) | [PUML](03B_CLASES_COMERCIO_E_INVENTARIO.puml) |
| **03C — Cases of use** | [Complete guide](03C_EXPLICACION_CASOS_DE_USO.md) | [SVG](03C_CASOS_DE_USO_REDISENADO.svg) | [PUML](03C_CASOS_DE_USO.puml) |

**How to use them:** The SVG is the approved editorial composition, with texts and vector lines; the PUML contains the editable model, but the PlantUML engine can place boxes and lines in different positions. In 03B relationships between panels were deliberately simplified to achieve a readable presentation; the semantics of references and SQL controls are explained in the guide and general document.

**Conventions:** 1 = one, 0.1 = optional, 0..* = many optional, 1..* = at least one; compositions are indicated with rhombus when applicable. Colours separate concepts and **do not create classes or permits**.

To teach or expose, open the SVG. To prepare SQLAlchemy, read Document 03 and the guides; do not convert a concept diagram directly into tables without validating permissions and restrictions.

**Synchronization C.5 (08/11/2026):** 03A corresponds to the identity, companies, memberships and actual invitations of E2-1. The User–Invitation relationship of the SVG represents the **mandatory issuer**; PlantUML source also includes **optional acceptor**. The recipient is identified by mail without prior FK. Locations, catalog and suppliers follow TO-BE for backend. 03B and 03C are preserved unchanged.

**Update E2-2 C:** source 03A and editorial SVG reconciled with `locations`including `CASA`, `ACTIVA/PAUSADA`, management permits by business role and single main active per company. The guide explains that staff assignments and granular authorization by location still **not implemented**03B/03C remain unchanged.

**E2-2 D:** Source 03A PlantUML sum `AsignacionUbicacion` with membership and location relations and FK rules per tenant. The SVG is a summary editorial sheet without that additional box, whose detail is documented in the guide. E2-1 and 03B/03C were not modified; local validation D pending.

**E2-3 E (closing catalogue):** 03A PUML contiene `ArticuloCatalogo` real with rating `kind` (ELABORATE/REVENT/INSUMO/SERVICE), GOOD/SERVICE type **derivative and not stored**, SKU/standardized name, unit and restrictions, optional BIGINT amounts, ACTIVE/INACTIVE status and five REST operations. The SVG maintains a compact editorial selection of attributes; the 03A guide records complete correspondence. **580 local Windows tests approved** and CI 3/3 on code D. `Proveedor` remains TO-BE, 03B and 03C were not modified. The previous historical sections describe their respective courts.

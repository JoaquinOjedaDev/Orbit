# E3-1C2 — Company data: visual design and QA criteria

**Base:** `main d3fe26b1de695253ae2aca920d89b941f7087f14`Reference: `Boton_Editar_Perfil_Empresa(2).html`.

## Scope
Visual and contextual editing of name/rub/activity, with status and membership from FastAPI. Technical data folded; accesses organized by Administration/Operations. No persistent logo or REAL images.

## Guarantees
- Same `GET /businesses/{id}` y `PATCH /businesses/{id}`, same validation and error management; no new endpoints.
- Edit Only if `canEditBusiness` is true; real authorization at FastAPI.
- No fictitious operations, `demoStore`, permission changes, token persistence or automatic writing.
- React goes back by tenant; it does not share forms between companies.
- All eight cards navigate exclusively to the commercial routes already available.

## QA before merge
1. See correct company and membership and display technical information.
2. Try editing/cancelling without PATCH and save/persist with authorized PATCH and F5.
3. Worker or company suspended: no edition; backend maintains 403/404.
4. Desktop and mobile 390px, zoom/keyboard and without horizontal scroll.
5. CI frontend/full-stack with ephemeral DB, manual revision, and prior merge authorization.

**Next pending:** E3-1C3 (Locations and Equipment).

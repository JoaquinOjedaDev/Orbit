# E2-5 — Git integrity statement of the documentary and audit package

**Version:** v1.2 of the closure published in PR #24, original commit `c66df2f8ddaa8179ca12e342bd3099348bc6b155`. Updated Manifesto in the Faith of Documentary Wrongs `docs/e2-5-fijar-sha-auditoria`.  
**Functional reference code:** `main` `748e69319d8d04900c009d5184168a264a9deeac`.  
**Date:** 09/11/2026.  
**Character:** Internal closure published and audit commission **published but not yet executed**. The faith of erratas does not change the code E2-5.  

This manifesto lists OID **Git blob** (SHA of Git content) of the **24 files of evidence, documentation and indexes**. **They're not SHA-256 hashes from loose files.**; the previous `12_MANIFIESTO_SHA256.txt` ZIP v1.0 is not valid for the current content. The manifest does not include itself to avoid self-reference.

| Repository file | Git blob OID |
|---|---|
| `plataforma-pyme/docs/revisiones/E2-5_AUDITORIA/00_LEEME_Y_PRECONDICIONES.md` | `b8011c7277828490d947511dbc4bb26a9e95651f` |
| `plataforma-pyme/docs/revisiones/E2-5_AUDITORIA/01_MATRIZ_AUDITORIA_E_INVARIANTES.md` | `5636b0ead1f0fc972b61587884e0eab92c44d04b` |
| `plataforma-pyme/docs/revisiones/E2-5_AUDITORIA/02_PLAN_PRUEBAS_Y_REPRODUCCION.md` | `fd10fd63b44daceee74e26d6064e429ed1e4c123` |
| `plataforma-pyme/docs/revisiones/E2-5_AUDITORIA/03_PROMPT_MAESTRO_AUDITOR_IA.md` | `31929c1f8f6ea943ad65fcb1e345730784d759f6` |
| `plataforma-pyme/docs/revisiones/E2-5_AUDITORIA/04_PLANTILLA_INFORME_Y_PR.md` | `0825fe85f305ff2379f1a9f263427cb8e411fbd5` |
| `plataforma-pyme/docs/revisiones/E2-5_AUDITORIA/05_CRITERIOS_ACEPTACION_Y_NO_REGRESION.md` | `5aa323508c4673f6dabe1bb2bcc6a458babfb822` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/00_LEEME.md` | `bfb360dc1c57cc66a8c5b6bfbd3371530497c631` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/01_INFORME_CONSOLIDADO.md` | `37baa4654ca4b5289b1fa30d338afd96ff040fb2` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/02_BITACORA_SWAGGER_E2-5_B.md` | `4f4e0e7c246a5f090e8f80565e67b069e951d8c0` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/03_BITACORA_SWAGGER_E2-5_C.md` | `6d0c77dd4869d922c0cda2958ec8abe8e5e7809a` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/04_PRUEBAS_AUTOMATIZADAS_CI_Y_WINDOWS.md` | `4ec016b037a82e2dcca4dfae6038ebe8736f53df` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/05_ARQUITECTURA_MODELO_Y_API.md` | `b18eb43d55eb2e873b232d5ef427ae23cc7ee2a7` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/06_MATRIZ_TRAZABILIDAD.md` | `bfd7b54059aeb50a227ff953ed0f12767cf62b27` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/07_FICHA_QA_SANITIZADA.md` | `7c770a0eb2c033ee8a4e7eea55676307922b1ed7` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/08_REPRODUCCION_SEGURA.md` | `532fe29e79df3a8fd0702cf44854e6aa7ada6d6f` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/09_RIESGOS_DEUDAS_Y_DECISIONES.md` | `2e5f11a29684d3f21cef5e10af4a696e68844c65` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/10_CHECKLIST_REVISION_Y_PUBLICACION.md` | `c6aeee023e4ca63f4a2da58487e34d78a30746eb` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/11_EVIDENCIA_ESTRUCTURADA.json` | `a5ce93be9ac05af642d82faadcca0878bd0ec11a` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/13_EVALUACION_OBSERVACIONES_IA.md` | `55ee57a8a2690d3ad2412f9c36eec3d8837daf88` |
| `plataforma-pyme/docs/revisiones/E2-5_CIERRE/14_REVISION_INTEGRAL_DOCUMENTAL.md` | `0d488a473727b6d20477d7b3a0418db4608c2e04` |
| `plataforma-pyme/docs/revisiones/E2-5_ENTREGA_PARA_REVISION.md` | `ecd34980388e603b7981920619d100d68b6688b2` |
| `plataforma-pyme/docs/revisiones/README.md` | `48c86aa6bc27f444c7e4d31404bfd796af7efe8f` |
| `plataforma-pyme/entrega-programacion-2/05_MATRIZ_API_Y_TRAZABILIDAD.md` | `fab7b8eaeb0b0e8956dbab71d356a07aa7948739` |
| `plataforma-pyme/entrega-programacion-2/README.md` | `3b2a2b140288b6f861ba746f191d2eaf3e70a99a` |

## Local check

After obtaining the exact branch/committee:

```powershell
git rev-parse HEAD
git status --short
git hash-object -- plataforma-pyme/docs/revisiones/E2-5_CIERRE/00_LEEME.md
git diff --name-status 748e69319d8d04900c009d5184168a264a9deeac HEAD
```

Repeat `git hash-object -- <ruta>` for any row and compare to the published OID. In a POSIX shell you can automate by table, without treating these OIDs as SHA-256. Check also `git diff --name-only` and the RP commit SHA to demonstrate that no code was introduced. **If you change any table file, regenerate the manifest in the last document commit**. The manifest's OID is verified when setting the commit Git of the branch.

**Security:** the package contains no real credentials or keys of idempotence. UUID QA were retained by explicit approval of the responsible. The session associated with the exposed token was revoked according to response `POST /api/v1/auth/logout` `204` provided by the developer (not an SQL query of all sessions).

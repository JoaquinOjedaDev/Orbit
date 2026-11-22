# E1-B2 — Global profile and work function by company

**Status:** Implemented in main; build, lint and pending local tests.
**Visual reference:** modal My Profile Menu_Principal(1).html.
**Scope:** remains local DEMO, without authentication, authorizations, APIs or real users.

## Concepts and rules

- Unique and GLOBAL personal profile: visible name, optional DEMO mail, optional initials avatar and optional DEMO phone.
- Avatar: up to four letters; if left empty, initials are derived from the name. It is displayed in the profile and top bar. External photographs are not loaded or linked.
- Work function: descriptive text of the membership of each company, independent of the global profile and role. It does not grant permissions or transform anyone into an administrator.
- Separate Save: Save my profile updates global data; Save DEMO function updates the feature only in the selected company.
- Permission simulations and predefined personal/telephone data in historical HTML are not copied.

## Compatible persistence

The same local key is conserved assistant-pyme.e1a2.demo.v1, schema version 1.

Optional new fields during loading:
- profile.avatarInitials: empty if missing.
- profile.contactPhone: empty if missing.
- memberJobs: businessId map to function; if missing, each membership uses empty jobTitle.

No profile.displayName, profile.email, createdBusinesses or fixtureEdits are deleted when saving. Operations are local to DEMO; the backend will have another schema, with real access control.

## Code

- frontend/src/data/demo/demoStore.ts: global DTO, membership, compatible storage and commands.
- frontend/src/features/profile/ProfilePage.tsx: profile and function forms.
- frontend/src/app/shell/TopBar.tsx: avatar global.
- frontend/src/App.tsx: memberships sent to My Profile.
- frontend/src/App.css: design and responsive.

## Pending verification

From platform-pyme/frontend:

~~~powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run dev
~~~

| Case | Procedure | Expected |
|---|---|---|
| PROFIL-01 | Enter My Profile after updating | Previous name and mail intact |
| PROFIL-02 | Save Fictice Initials | Profile Avatar and Top Bar Match |
| PROFIL-03 | Delete initials | Letters derived from the name appear |
| PROFIL-04 | Enter five letters or numbers as initials | Validation prevents saving |
| PROFIL-05 | Save fictitious phone and reload F5 | Local persistence |
| PROFIL-06 | Define different job roles in WALOS and Commerce; F5 | Each company retains its function |
| PROFIL-07 | Edit Global Profile After Post | Functions are not deleted |
| PROFIL-08 | Visit a company created previously | Company and previous changes retained |
| PROFIL-09 | View forms with 390 px | No horizontal overflow |
| PROFIL-10 | Build y lint | Zero errors and zero warnings |

Do not use real names, emails or phones in DEMO; localStorage does not provide security or synchronization.

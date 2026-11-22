# E1-C3 — Accounts and means of collection associated with the company (DEMO)

**Date:** 2026-11-06. **Status:** first vertical published in `main`, pending `build`, `lint`, automated testing and manual QA in VS Code of the team. Banks and Real Payment Market are not integrated.  
**Origin:** plan v4, E0-B and ADR-001/005/006; continuation of E1-C1 Sales and E1-C2 Expenditures/Box.

## Objective

Manage from the selected company references of bank accounts and virtual wallets, without confusing them with the physical box, declared payments or external accreditations.

## Built-in behaviour

- Existing Menu **Administration → Accounts and means**: route `/b/:businessId/cuentas`.
- Sheets by company `DemoFinancialAccount` with ID, identifier name, type (bank/billionaire), institution, optional reference holder, optional alias, optional CBU/CVU, declared channel, notes, status, main and dates.
- To identify an account is requested at least **alias** de 6 a 20 caracteres o **22 digit CBU/CVU**; formatting is validated, **no** authenticity, ownership and ability to receive money.
- Information channels: Declared Transfer, Unconnected Payment Market, Declared ID Account, other declared wallets. Bank accounts are shown only with Transfer as channel; cash is not modeled as a bank account.
- High, active account editing, disable/reactivate (undelete), select one main active account per company, search and filters. When deactivating the main account, no other is quietly assigned; it remains to be chosen.
- Duplicate names, aliases and CBU/CVU are rejected **within a company**, including inactive tokens. No global singleness is required between companies; WALOS never reads accounts of Trade Example.
- In listings, the 22 digit identifier is partially hidden; **Copy DEMO data** expressly copy name, institution, holder, alias and CBU/CVU to share voluntarily. It does not generate public link or real QR.
- Optional persistence compatible in the same existing key of `localStorage`without changing the version or deleting companies, products, locations, photos, purchases, inventory, sales, expenses or previous closures.
- The first account created is marked as the main one when there was no active one. From now on you can select the main one manually.
- The catalogue, Shopping, Sales, Expenses and Box continue to work as before. **no** there is transactional relationship `payment.accountId`, reconciliation or accreditation. An account in the directory does NOT mean that the bank has verified it.
- Real payment market is left for backend: OAuth **Each company/seller**, protected credentials, webhook and conciliation. The QR distinction of article against QR is retained for collection.

## Files

- `frontend/src/data/demo/financialAccountPolicy.ts`: Reference DTO and pure validations.
- `frontend/src/data/demo/demoStore.ts`: `financialAccountsById`, optional recovery, selectors, commands `createFinancialAccount`, `updateFinancialAccount`, `setFinancialAccountStatus`, `setPrimaryFinancialAccount`.
- `frontend/src/features/accounts/FinancialAccountsPage.tsx`: interface and form.
- `frontend/src/App.tsx`, `src/app/navigation.ts`, `src/features/dashboard/Dashboards.tsx`, `src/App.css`: route and navigation.
- `frontend/tests/financial-account-policy.test.mjs`: 12 pure tests; command `npm.cmd run test:accounts`.

## Proposed tests

If you're already in `plataforma-pyme/frontend`, **Don't make another one. `cd`**:

```powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:accounts
npm.cmd run test:cash
npm.cmd run test:sales
npm.cmd run dev
```

In the browser `http://localhost:5173`:

| ID | Action | Expected |
|---|---|---|
| CUE-01 | In WALOS enter Accounts and media | You see the empty directory or own accounts; they do not mix with other businesses |
| CUE-02 | Create an example bank account: tag "Test Bank", institution "Example Bank", alias "walos.banko.demo", without CBU | Active and main account if it was the first; appears on cards |
| CUE-03 | Create wallet "Billetera demo", channel Mercado Pago (declared), alias "walos. billetera" | Second active tab, not connected to Pago Market |
| CUE-04 | Edit wallet: change name/institution, save | New text is seen; bank account does not change |
| CUE-05 | Choose the wallet as main | One main active for WALOS |
| CUE-06 | Deactivate main account | It is conserved in Inactive/All, it is no longer main; the bank remains available |
| CUE-07 | Reactivate account and change principal | Allows both actions, without creating duplicates |
| CUE-08 | Try to create another account with the same alias of WALOS | Clear duplicate error; does not change directory |
| CUE-09 | Create another account with an alias like this but in Trade Example | Allowed, because it is another DEMO company |
| CUE-10 | 21 character CBU or invalid alias | Rejection by format; no bank verification invented |
| CUE-11 | Click Copy Fictious Account DEMO Data | Clipboard contains reference, alias and CBU/CVU if entered |
| CUE-12 | Reload with F5, change company and return to WALOS | It retains references, status and principal of each company |
| CUE-13 | Consult Box and previous historical closure | Expected amount/counted/difference not amended |
| CUE-14 | Run build/lint and account/box/sales tests | Register local result; not declare it approved before execution |

**Important:** in DEMO **do not upload real data** (alias/CBU/CVU private, tokens, passwords, credentials, cards). `localStorage`, readable by whoever uses that browser. CBU/CVU are saved without server encryption because there is still no backend; this screen is only for fictitious samples.

## Units for the next integration

When the equipment validates this vertical: design `FinancialAccount` y `PaymentChannel` Real in the domain model and API contracts, with business authorization, account restrictions and audit; then choose target account on Sales and home account on Expenditures **without rewriting historical amounts**. External accreditations only through verified supplier integration, never by frontend inference.

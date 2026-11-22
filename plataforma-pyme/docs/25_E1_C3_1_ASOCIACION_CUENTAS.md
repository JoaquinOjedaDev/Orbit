# E1-C3.1 — References for accounts in payments and DEMO collections

**Status:** Initial cut E1-C3.1 with build, lint and 40 automated tests validated by the equipment; adjustment of transfer to wallets published for new local testing and manual QA.

## Functional decision

- A digital sale by transfer, ID Account or Declared Payment Market may include a reference receiving account.
- An expense per transfer, ID Account, Payment Market or other declared means may include a reference source account.
- The account is **optional**. Registering without account is still allowed. Cash and card do not use the accounts directory.
- Only active accounts belonging to the same business are accepted and are compatible with the declared media. **Transfer** supports both bank accounts and virtual wallets declared (by alias or fictitious CBU/CVU). **Market Payment**, **ID account** y **Other** still require your corresponding channel. The gateway repeats the check when saving, not just on the screen.
- The main account stands out as a suggestion in the selector; it is never chosen in silence.
- The transaction stores ID and account name at the time of registration, so that future modification or deactivation does not alter history.
- Deactivate only prevents new partnerships in the application; it does not block a real bank account.
- No funds are moved, no accreditation is inferred, and no financial balance is calculated.
- The key and version of localStorage are not modified. Previous sales/expenditures do not require account and previous cash snapshots are respected.

## Evidence

From `plataforma-pyme/frontend`:

```powershell
git pull --ff-only origin main
npm.cmd run build
npm.cmd run lint
npm.cmd run test:accounts
npm.cmd run test:sales
npm.cmd run test:cash
npm.cmd run dev
```

| Case | Action | Outcome |
|---|---|---|
| VINC-01 | Sale by transfer with WALOS bank | Account on voucher |
| VINC-02 | Sale Market Payment with compatible wallet | Only active MP accounts |
| VINC-03 | Bank transfer expenditure | History source account |
| VINC-04 | Digital sales or spending without a chosen account | Allowed |
| VINC-05 | Disable an account used before | Not selectable in new movements; historical reference intact |
| VINC-06 | Switch to Trade Example | Invisible WALOS accounts |
| VINC-07 | Switching Mean to Cash | Clear selection; if there is a day, only effective affect |
| VINC-08 | Reload F5 and review historical closure | Accounts and transactions persist without altering archaeology |
| VINC-09 | For Sales, choose **Transfer** having bank and wallet MP active | Both types of account appear; it is possible to choose the wallet as destination |
| VINC-10 | In Expenses, choose **Transfer** with the same accounts | Bank and wallet appear as declared origin |
| VINC-11 | Elegir **Market Payment (declared)** | Only wallets declared as MP appear, not any transfer account |
| VINC-12 | Disable wallet and re-elect **Transfer** | Not eligible wallet for new operations; history preserved |

**Next cut of plan v4:** E1-D1 — QR DEMO Charge. The QR item is different from the QR collection. Real integration with each Market Payment seller requires backend.

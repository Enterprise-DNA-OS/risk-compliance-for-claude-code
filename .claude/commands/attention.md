---
description: Everything that needs a person this week, in one list: breached rules, overdue actions and tests, missed reviews, unowned risks, and high risks gone quiet
---

Everything that needs a person this week, in one list: breached rules, overdue actions and tests, missed reviews, unowned risks, and high risks gone quiet. Present severity 1 first, then group the rest by owner.

Run: `node scripts/risk.mjs attention`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

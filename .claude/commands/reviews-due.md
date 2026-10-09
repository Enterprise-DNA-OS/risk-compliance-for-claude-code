---
description: The quarterly risk review list: risks whose review date has passed or falls inside the window
---

The quarterly risk review list: risks whose review date has passed or falls inside the window. Default 30 days. Group by owner so each person gets one list.

Run: `node scripts/risk.mjs reviews-due`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

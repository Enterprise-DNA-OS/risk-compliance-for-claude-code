---
description: Open internal audit findings, overdue first
---

Open internal audit findings, overdue first. Group by owner and say which high-rated findings are past due.

Run: `node scripts/risk.mjs audit-findings` with optional --all for closed findings too. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

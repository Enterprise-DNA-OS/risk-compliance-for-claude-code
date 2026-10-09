---
description: Record a business continuity exercise or a BCP review for a critical operation
---

Record a business continuity exercise or a BCP review for a critical operation. Use the date it happened.

Run: `node scripts/risk.mjs exercise` with --operation --kind=exercise|bcp-review --actor; optional --date. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

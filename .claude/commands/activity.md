---
description: Show what has been recorded, newest first, for one record or the whole system
---

Show what has been recorded, newest first, for one record or the whole system. Use it to answer who changed what and when.

Run: `node scripts/risk.mjs activity` with Recorded history: optional --record. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

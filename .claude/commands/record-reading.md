---
description: Record a key risk indicator reading
---

Record a key risk indicator reading. Say the value and date back before recording. The result says red, amber or green; if red, say who to escalate to.

Run: `node scripts/risk.mjs record-reading` with --indicator --value --actor; optional --date --note. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

---
description: Show the risk register, highest residual rating first
---

Show the risk register, highest residual rating first. Lead with risks over appetite and the owners who hold them. Filter by category, owner or rating when the operator names one.

Run: `node scripts/risk.mjs risks` with The risk register: optional --category --owner --rating. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

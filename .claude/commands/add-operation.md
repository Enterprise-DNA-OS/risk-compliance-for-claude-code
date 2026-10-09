---
description: Add a critical operation with its tolerance levels (CPS 230 para 38)
---

Add a critical operation with its tolerance levels (CPS 230 para 38). Tolerance levels are the board's decision. Ask for them.

Run: `node scripts/risk.mjs add-operation` with --reference --name --owner --actor; optional --max-outage-hours --max-data-loss-hours --service-level. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

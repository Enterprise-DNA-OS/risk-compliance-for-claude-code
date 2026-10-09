---
description: Show where the open risks sit on the likelihood by consequence grid
---

Show where the open risks sit on the likelihood by consequence grid. Default is residual. Run with --inherent as well when the operator asks how much the controls are doing, and explain the shift.

Run: `node scripts/risk.mjs heat-map` with Open risks on the likelihood by consequence grid: optional --inherent. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

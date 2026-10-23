---
description: Close an internal audit finding with the evidence it is fixed
---

Close an internal audit finding with the evidence it is fixed. No evidence, no close.

Run: `node scripts/risk.mjs close-finding` with --finding --evidence --actor; optional --date. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

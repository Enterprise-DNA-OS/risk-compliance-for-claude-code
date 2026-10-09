---
description: Close an incident with its root cause
---

Close an incident with its root cause. It will not close while actions are open, a required APRA notice is unrecorded, or a privacy assessment or notice is missing.

Run: `node scripts/risk.mjs close-incident` with --incident --root-cause --actor; optional --date. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

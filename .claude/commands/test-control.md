---
description: Record a control test result with its evidence
---

Record a control test result with its evidence. The result sets the control's effectiveness. Evidence is a location the operator gives; this system does not open or verify it.

Run: `node scripts/risk.mjs test-control` with --risk --control --result=effective|partially-effective|ineffective --evidence --actor; optional --date --note. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

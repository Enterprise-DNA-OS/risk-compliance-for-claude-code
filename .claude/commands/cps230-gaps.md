---
description: The CPS 230 gaps: critical operations and material providers checked against tolerance levels, exercises, BCP reviews, APRA notices and provider reviews
---

The CPS 230 gaps: critical operations and material providers checked against tolerance levels, exercises, BCP reviews, APRA notices and provider reviews. Lead with the severity 1 findings, then each operation and provider with a gap, with the paragraph cited. Overdue control tests are one line here; /controls-due has the list.

Run: `node scripts/risk.mjs cps230-gaps`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

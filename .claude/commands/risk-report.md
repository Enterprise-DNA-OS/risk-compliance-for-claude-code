---
description: Write the risk committee report as a draft in drafts/
---

Write the risk committee report as a draft in drafts/. Ask for the date of the last meeting and pass it as --since. Read the draft back, check every number against the register, and tell the operator it is a draft for the chair.

Run: `node scripts/risk.mjs risk-report` with Write the risk committee report to drafts/: optional --since. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

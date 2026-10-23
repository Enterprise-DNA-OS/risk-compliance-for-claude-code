---
description: Write the quarterly board risk report as a branded HTML page in drafts/
---

Write the quarterly board risk report as a branded HTML page in drafts/. Ask for the start of the quarter or the date of the last board meeting and pass it as --since (default 90 days). Open the file, check the decisions list and every figure against the register, and tell the operator it is a draft for the Chief Risk Officer. Print to PDF from the browser for the board pack.

Run: `node scripts/risk.mjs board-report` with optional --since=YYYY-MM-DD. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

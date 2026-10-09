---
description: The Monday risk review, written from the CLI output
---

The Monday risk review, written from the CLI output. Write it in five parts: notice clocks and breaches, overdue actions, reviews due this week, control tests due this week, risks over appetite. One line each, owner named.

Run: `node scripts/risk.mjs weekly-review`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

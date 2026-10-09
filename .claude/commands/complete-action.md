---
description: Mark an action done with the evidence that it is done
---

Mark an action done with the evidence that it is done. No evidence, no completion.

Run: `node scripts/risk.mjs complete-action` with --action --evidence --actor; optional --date. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

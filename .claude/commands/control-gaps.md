---
description: List the controls a risk relies on that are ineffective, partly effective or never tested
---

List the controls a risk relies on that are ineffective, partly effective or never tested. Order by the risk they protect. Suggest a test date or a treatment action, never mark a control effective without evidence.

Run: `node scripts/risk.mjs control-gaps`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

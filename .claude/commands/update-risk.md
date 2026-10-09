---
description: Change a risk's title, description, category, owner, status or next review date
---

Change a risk's title, description, category, owner, status or next review date. Closing a risk needs every action on it finished first.

Run: `node scripts/risk.mjs update-risk` with --risk --actor with changed fields: --title --description --category --owner --status --next-review. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

---
description: Show which residual ratings went up or down since a date, usually the last committee meeting
---

Show which residual ratings went up or down since a date, usually the last committee meeting. Ask for the meeting date if the operator has not given one. Explain each move from the review note.

Run: `node scripts/risk.mjs movement`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

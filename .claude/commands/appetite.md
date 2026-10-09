---
description: List the risks the board has not accepted at their current rating
---

List the risks the board has not accepted at their current rating. For each, say whether a treatment action is open and on time. A risk over appetite with nothing open is the first thing to raise.

Run: `node scripts/risk.mjs appetite`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

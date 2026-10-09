---
description: Write every record to one JSON backup in exports/
---

Write every record to one JSON backup in exports/. The file holds personal and sensitive information. Tell the operator where it is and to keep it somewhere safe.

Run: `node scripts/risk.mjs export`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

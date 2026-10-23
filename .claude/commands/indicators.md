---
description: Key risk indicators with the latest reading, red, amber or green
---

Key risk indicators with the latest reading, red, amber or green. Lead with red, then amber, then any with no reading. Say which way each one is moving and which risk it watches.

Run: `node scripts/risk.mjs indicators` with optional --status=red|amber|green. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

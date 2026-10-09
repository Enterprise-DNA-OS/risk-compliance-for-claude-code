---
description: Record a provider review, an agreement change, an APRA notice or an exit
---

Record a provider review, an agreement change, an APRA notice or an exit. An agreement change restarts the APRA clock.

Run: `node scripts/risk.mjs update-provider` with --provider --actor with changed fields: --material --operation --agreement-changed --regulator-notified --reviewed --status. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

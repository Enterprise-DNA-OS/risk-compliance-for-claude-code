---
description: Compliance obligations due for attestation, plus any whose last attestation recorded a breach
---

Compliance obligations due for attestation, plus any whose last attestation recorded a breach. Default 30 days. A recorded breach always shows, whatever its date.

Run: `node scripts/risk.mjs obligations-due`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

---
description: Prepare an internal draft of a notice to APRA, the NZ Privacy Commissioner (opc) or the OAIC (oaic)
---

Prepare an internal draft of a notice to APRA, the NZ Privacy Commissioner (opc) or the OAIC (oaic). Read the incident in full first. Fill what the records support and leave the brackets for facts only a person knows. Never send: the responsible officer checks and lodges it.

Run: `node scripts/risk.mjs draft-notification`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

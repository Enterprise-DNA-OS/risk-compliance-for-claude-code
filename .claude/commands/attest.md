---
description: Record an attestation: compliant, partial or breach, with evidence
---

Record an attestation: compliant, partial or breach, with evidence. A breach attestation stays on the list until it has an incident and treatment behind it.

Run: `node scripts/risk.mjs attest` with --obligation --outcome=compliant|partial|breach --evidence --actor; optional --date --note. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

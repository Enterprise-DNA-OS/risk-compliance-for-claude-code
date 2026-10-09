---
description: Find risks that had an incident after their last review
---

Find risks that had an incident after their last review. These ratings were set before the business learnt something. Suggest a review for each, with the incident named.

Run: `node scripts/risk.mjs stale-ratings`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

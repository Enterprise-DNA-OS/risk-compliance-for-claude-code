---
description: Record a risk review: the new residual likelihood and consequence and why
---

Record a risk review: the new residual likelihood and consequence and why. The note is required and becomes the history the committee reads. The next review date follows the category cycle unless the operator gives one.

Run: `node scripts/risk.mjs review-risk` with --risk --residual-likelihood --residual-consequence --note --actor; optional --date --next-review. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

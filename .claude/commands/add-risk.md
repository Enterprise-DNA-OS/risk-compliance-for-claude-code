---
description: Add a risk to the register
---

Add a risk to the register. Ask for likelihood and consequence in the business's own words, and map them to the scale. Residual cannot be higher than inherent.

Run: `node scripts/risk.mjs add-risk` with --reference --title --category --owner --likelihood --consequence --actor; optional --description --residual-likelihood --residual-consequence --next-review. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

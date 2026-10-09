---
description: Add a risk category with its appetite score and review cycle
---

Add a risk category with its appetite score and review cycle. The appetite is the board's decision. Ask for it; never pick one.

Run: `node scripts/risk.mjs add-category` with --name --appetite --review-every --actor. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

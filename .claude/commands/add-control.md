---
description: Add a control to a risk, with its owner and test cycle
---

Add a control to a risk, with its owner and test cycle. A new control starts as not tested.

Run: `node scripts/risk.mjs add-control` with --risk --reference --title --owner --actor; optional --kind --test-every. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

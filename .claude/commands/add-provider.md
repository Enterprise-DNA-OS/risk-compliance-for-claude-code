---
description: Add a service provider, whether it is material, and the critical operation it supports
---

Add a service provider, whether it is material, and the critical operation it supports. Record when its agreement was entered or materially changed: that starts the 20 business day APRA clock.

Run: `node scripts/risk.mjs add-provider` with --reference --name --service --owner --actor; optional --material --operation --agreement-changed. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

---
description: Show or change who this is for and which rule sets apply: jurisdiction, APRA-regulated, ASX-listed, the last framework review
---

Show or change who this is for and which rule sets apply: jurisdiction, APRA-regulated, ASX-listed, the last framework review. Changing a setting turns rules on or off. Say which findings will appear or disappear before you change it.

Run: `node scripts/risk.mjs settings` with Show or change the organisation: optional --name --jurisdiction --apra-regulated --asx-listed --framework-reviewed --actor. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

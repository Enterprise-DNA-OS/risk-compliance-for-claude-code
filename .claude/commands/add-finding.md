---
description: Add an internal audit finding with its rating, owner and due date
---

Add an internal audit finding with its rating, owner and due date. Link it to the risk, and the control if the auditor named one. The rating is the auditor's, not yours.

Run: `node scripts/risk.mjs add-finding` with --reference --audit --title --rating=low|medium|high --owner --due --actor; optional --risk --control --raised --description. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

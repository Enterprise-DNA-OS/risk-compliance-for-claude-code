---
description: Add a treatment action to a risk, or a follow-up action to an incident
---

Add a treatment action to a risk, or a follow-up action to an incident. Every action needs one owner and a due date.

Run: `node scripts/risk.mjs add-action` with --reference --title --owner --due --actor and --risk or --incident. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

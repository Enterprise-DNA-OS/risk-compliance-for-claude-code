---
description: Add a key risk indicator with its amber and red thresholds
---

Add a key risk indicator with its amber and red thresholds. Ask which way is worse (higher, like overdue patches, or lower, like availability), how often it is measured, and the risk it watches. Never set the thresholds yourself: they are the owner's or the board's.

Run: `node scripts/risk.mjs add-indicator` with --reference --name --owner --amber --red --actor; optional --risk --operation --unit --direction=higher|lower --every --description. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

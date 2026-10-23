---
description: Indicator readings at amber or red, this month by default
---

Indicator readings at amber or red, this month by default. Red is a breach, amber is a warning: say which is which. Name the owner and the risk each indicator watches, and offer to add a treatment action on that risk.

Run: `node scripts/risk.mjs indicator-breaches` with --since=YYYY-MM-DD (default the first of this month). Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

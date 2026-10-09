---
description: Record an incident or near miss as soon as the business is aware of it
---

Record an incident or near miss as soon as the business is aware of it. The aware time starts every notice clock, so get it right (UTC unless an offset is given). Ask whether it touches a critical operation, whether the impact could be material, and whether personal information is involved.

Run: `node scripts/risk.mjs log-incident` with --reference --title --aware --actor; optional --occurred --kind --severity --owner --risk --operation --description --material-impact --outside-tolerance --privacy=NZ|AU. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

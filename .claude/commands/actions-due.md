---
description: Open treatment and incident actions due inside the window, overdue first
---

Open treatment and incident actions due inside the window, overdue first. Default 14 days. Name the owner and how late each one is.

Run: `node scripts/risk.mjs actions-due`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

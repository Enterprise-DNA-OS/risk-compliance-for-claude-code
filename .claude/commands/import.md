---
description: Bring a Camms risk register export across
---

Bring a Camms risk register export across. Read docs/replace-camms.md first. Use a separate DATA_DIR for the first try, run with --dry-run, then for real. Imported risks arrive as drafts; review each one before opening it.

Run: `node scripts/risk.mjs import camms` with --file=export.csv --actor; optional --map=columns.json --dry-run. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

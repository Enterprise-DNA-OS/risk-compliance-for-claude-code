---
description: Bring a Camms or Protecht register export across
---

Bring a Camms or Protecht register export across. Read docs/replace-camms.md or docs/replace-protecht.md first. Use a separate DATA_DIR for the first try, run with --dry-run, then for real. Imported risks arrive as drafts; review each one before opening it. For Protecht, import the risk register before the incident register so incidents find their risks, and ask what time zone the export's times are in (--offset=+10:00 for Sydney winter time, +11:00 in summer).

Run: `node scripts/risk.mjs import camms|protecht-risks|protecht-incidents` with --file=export.csv --actor; optional --map=columns.json --offset=+10:00 --dry-run. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

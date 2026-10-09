---
description: Add a compliance obligation with its source and how often someone attests to it
---

Add a compliance obligation with its source and how often someone attests to it. The source is the law, standard or policy it comes from, written so a reader can find it.

Run: `node scripts/risk.mjs add-obligation` with --reference --title --source --owner --actor; optional --attest-every. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

---
description: Count overdue reviews, tests, actions and attestations for each owner
---

Count overdue reviews, tests, actions and attestations for each owner. Use it before a committee meeting to see who needs help, not to blame.

Run: `node scripts/risk.mjs owner-workload`. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

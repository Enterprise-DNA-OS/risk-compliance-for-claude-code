---
description: Record what has happened since: the link to a risk, APRA notice, the privacy assessment and notice, the root cause
---

Record what has happened since: the link to a risk, APRA notice, the privacy assessment and notice, the root cause. Record notices only once they have actually been made by a person.

Run: `node scripts/risk.mjs update-incident` with --incident --actor with changed fields: --risk --operation --severity --owner --material-impact --outside-tolerance --regulator-notified --privacy-assessed --privacy-notifiable --privacy-notified --root-cause. Add `--json` for structured results.

The CLI output is the source. If a name matches more than one record, show the candidates and ask; an error is never permission to use a different record. Nothing here sends, lodges, pays or deletes.

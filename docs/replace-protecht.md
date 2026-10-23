# Moving off Protecht ERM

Protecht ERM keeps each register (risks, incidents, controls, compliance, KRIs) as its own set of records, and each register can be exported to CSV or Excel. Columns follow how your registers were configured, so the import reads the common headings and lets you map your own. The headings below are the usual ones. We have not seen every Protecht configuration: if yours differ, write a map (step 3).

Two registers come across today: the risk register and the incident register. Bring the risks first, so each incident can find the risk it is linked to.

## 1. Export the two registers

In Protecht ERM, open the risk register, show every open risk with its category, owner, inherent and residual likelihood and impact, and next review date, and export to CSV (UTF-8). Do the same for the incident register with the dates occurred and identified, severity, owner, linked risk, status, date closed and root cause. If you cannot find an export, ask your Protecht administrator which report holds the register.

## 2. Try both on a separate copy

```bash
DATA_DIR=./.data/trial npm run migrate
DATA_DIR=./.data/trial npm run risk -- add-category --name="Operational" --appetite=9 --actor="Your name"   # one per category, with the appetite your board set
DATA_DIR=./.data/trial npm run risk -- import protecht-risks --file=risks.csv --actor="Your name" --dry-run
DATA_DIR=./.data/trial npm run risk -- import protecht-incidents --file=incidents.csv --offset=+10:00 --actor="Your name" --dry-run
```

A dry run reads every row, checks it and rolls back. Nothing is saved. The incident dry run can only find linked risks that are already imported, so run the risk import for real in the trial copy first.

### Risk register headings

| Field | Headings it reads |
|---|---|
| Source ID (required) | Risk ID, Risk Id, ID |
| Reference | Risk Reference, Risk Code, Risk Number, Risk ID |
| Title (required) | Risk Title, Risk Name, Title, Name |
| Description | Risk Description, Description |
| Category (required) | Risk Category, Category, Risk Type |
| Owner | Risk Owner, Owner, Accountable Owner |
| Inherent likelihood and impact (required) | Inherent Likelihood, Inherent Impact (or Inherent Consequence) |
| Residual likelihood and impact | Residual Likelihood, Current Likelihood, Residual Impact, Residual Consequence, Current Impact |
| Next review | Next Review Date, Review Due Date, Next Review |

Likelihood and impact can be 1 to 5, a label from your scale (`Likely`, `Major`), a common synonym (`Almost Certain`, `Catastrophic`) or `3 - Possible` style text. Every category must exist first. The import never invents an appetite.

### Incident register headings

| Field | Headings it reads |
|---|---|
| Source ID (required) | Incident ID, Event ID, ID |
| Reference | Incident Reference, Incident Number, Incident ID, Event ID |
| Title (required) | Incident Title, Title, Event Title, Summary |
| Description | Incident Description, Description |
| Kind | Event Type, Incident Type, Type (anything containing "near" is a near miss) |
| Severity | Severity, Incident Rating, Rating, Impact Rating (Low, Medium, High, Critical and the 1 to 5 forms map to minor, moderate, major, severe) |
| Owner | Incident Owner, Owner, Assigned To |
| Date occurred | Date Occurred, Occurred Date, Event Date |
| Date identified (required, or date occurred) | Date Identified, Date Discovered, Identified Date, Date Reported |
| Linked risk | Linked Risk, Related Risk, Risk ID (matched to an imported risk's ID or reference) |
| Status | Incident Status, Status (Closed, Resolved, Complete and Finalised close it) |
| Date closed | Date Closed, Closed Date (required when closed) |
| Root cause | Root Cause, Cause |

Dates are DD/MM/YYYY or YYYY-MM-DD, with an optional HH:MM. Exports print local time, so pass `--offset` with your time zone: `+10:00` for Sydney, Melbourne and Brisbane in winter, `+11:00` for Sydney and Melbourne in daylight saving. Without it, times are read as UTC.

## 3. Map your own headings

If your headings differ, write a map and pass `--map=columns.json`. The keys are the field names in the left column of the tables (as `source_id`, `title`, `inherent_consequence`, `aware`, `risk` and so on):

```json
{ "source_id": "Ref", "title": "Event", "aware": "Reported On", "risk": "Parent Risk" }
```

## 4. Import and review

Run both again without `--dry-run`. What happens:

- Risks arrive as drafts with the original row kept in `source_row`. A row with no residual rating takes the inherent rating, and the import says how many did. `/compliance` lists every draft under POLICY-IMPORT until someone confirms its ratings and owner.
- Incidents arrive open or closed with their dates, severity, owner, linked risk and root cause, and the original row kept. The import never marks an incident as material, outside tolerance or a privacy breach, and never records a notice as made. Those are judgements for a responsible person: record them with `update-incident` for any open incident that needs them.
- Running the same file again changes nothing. If a row changed in Protecht since the last import, the import stops and names it, so a reviewed record is never overwritten. One bad row stops the whole file and nothing is saved.

## What does not come across yet

- Controls and tests, KRIs and their readings, compliance obligations and attestations, and audit findings are separate Protecht registers. Each has a table and commands here already; ask Claude Code to write an import for that register's columns, in the same pattern.
- Protecht's REST API and SFTP feeds. The CSV export is the route today.
- Attachments, comments and the audit trail stay in Protecht. Export them and keep them with your records.
- Workflows, approvals, email notifications, forms and dashboards are Protecht screens. Here they are commands, drafts in `drafts/` and `npm run view`.

## Run both side by side

Keep Protecht open for one reporting cycle. Run `/weekly-review`, `/indicators` and `/board-report` here and compare them with the Protecht reports. Switch off Protecht when the board pack from this system matches.

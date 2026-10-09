# Moving off Camms

Camms is now part of Riskonnect. Its risk register can be exported to Excel or CSV from a register report. The headings depend on how your Camms instance was set up, so the import reads the common headings and lets you map your own.

## 1. Export the register

In Camms, run the risk register report with every open risk, its category, owner, inherent and residual likelihood and consequence, and next review date. Export to Excel and save it as CSV (UTF-8). If you cannot find an export, ask your Camms administrator or Riskonnect support which report holds the register.

## 2. Try the import on a separate copy

```bash
DATA_DIR=./.data/trial npm run migrate
DATA_DIR=./.data/trial npm run risk -- import camms --file=register.csv --actor="Your name" --dry-run
```

The dry run reads every row, checks it and rolls back. Nothing is saved.

The import looks for these headings (any one in each row, case does not matter):

| Field | Headings it reads |
|---|---|
| Source ID (required) | Risk ID, Risk Id, ID |
| Reference | Risk Code, Risk Reference, Risk Number, Risk ID |
| Title (required) | Risk Title, Risk Name, Title, Risk |
| Description | Risk Description, Description |
| Category (required) | Risk Category, Category |
| Owner | Risk Owner, Responsible Officer, Owner |
| Inherent likelihood and consequence (required) | Inherent Likelihood, Inherent Consequence |
| Residual likelihood and consequence | Residual Likelihood, Current Likelihood, Residual Consequence, Current Consequence |
| Next review | Next Review Date, Review Date (YYYY-MM-DD or DD/MM/YYYY) |

If your headings differ, write a map and pass `--map=columns.json`:

```json
{ "source_id": "Ref No", "title": "Risk", "category": "Group", "inherent_likelihood": "L", "inherent_consequence": "C" }
```

Likelihood and consequence can be 1 to 5, a label from your scale (`Likely`, `Major`), a common synonym (`Almost Certain`, `Catastrophic`), or `3 - Possible` style text. Every category must exist first: add yours with `add-category`, with the appetite your board set. The import never invents an appetite.

## 3. Import and review

Run it again without `--dry-run`. Every risk arrives as a draft with its original row kept in `source_row`. A row with no residual rating takes the inherent rating, and the import tells you how many did. `/compliance` lists every draft under POLICY-IMPORT until someone confirms its ratings and owner.

Running the same file again changes nothing. If a row changed in Camms since the last import, the import stops and names it, so a reviewed record is never overwritten.

## What does not come across in the register export

- Controls, treatment actions, incidents, compliance obligations and attestations are separate Camms reports. Add them with the commands, or ask Claude Code to write an import for each report's columns.
- Attachments and the audit trail stay in Camms. Export them and keep them with your records.
- Workflow approvals and dashboards are Camms screens. Here they are commands and `npm run view`.

## Run both side by side

Keep Camms open for one review cycle. Run `/weekly-review` and `/risk-report` here and compare them with the Camms reports. Switch off Camms when the committee pack from this system matches.

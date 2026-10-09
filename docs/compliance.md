# The rules this system checks

Sources checked 9 October 2026. `npm run risk -- compliance` (or `/compliance`) runs every rule below against the records and cites the rule on each finding. This is a record checker. It does not decide whether an incident is material, whether a breach is likely to cause serious harm, or whether a notice was adequate. Those are judgements for a responsible person, recorded in the incident with `update-incident`. Nothing here is legal advice.

The CPS 230 rules apply only when `settings --apra-regulated=true`. The ASX rule applies only when `settings --asx-listed=true`. The privacy rules apply to any incident recorded as a privacy breach with a jurisdiction.

| Rule | What it checks | Source |
|---|---|---|
| CPS230-33 | An incident marked as likely to have a material financial impact, or a material impact on critical operations, has no APRA notice recorded. Due 72 hours after the business became aware. | [APRA CPS 230](https://www.apra.gov.au/sites/default/files/2023-07/Prudential%20Standard%20CPS%20230%20Operational%20Risk%20Management%20-%20clean.pdf) para 33 |
| CPS230-42 | A disruption to a critical operation outside tolerance has no APRA notice recorded. Due 24 hours after awareness. | CPS 230 para 42 |
| CPS230-38 | A critical operation has no maximum outage or maximum data loss tolerance. | CPS 230 para 38 |
| CPS230-43 | A critical operation has no business continuity exercise in the last 365 days. | CPS 230 para 43 (an annual business continuity exercise) |
| CPS230-45 | A critical operation's BCP has no recorded review in the last 365 days. | CPS 230 para 45 (update, as necessary, on an annual basis) |
| CPS230-59 | A provider supporting a critical operation had its agreement entered or materially changed, and APRA has no notice recorded since. Due 20 business days after the change. | CPS 230 para 59(a) |
| CPS230-30 | A control on an open risk is past its test date or has never been tested. | CPS 230 para 30 (test controls at a frequency matched to materiality) |
| CPS230-32 | An incident is not linked to a risk, so the risk profile has not taken it into account. | CPS 230 para 32 |
| NZ-PA-114 | A New Zealand privacy breach has no notifiability decision, or is notifiable and has no notice to the Privacy Commissioner recorded. | [Privacy Act 2020 s114](https://www.nzlii.org/nz/legis/consol_act/pa2020108/s114.html). The [Privacy Commissioner](https://privacy.org.nz/assets/New-order/Resources-/Publications/Guidance-resources/Privacy-Act-2020-Information-sheet-2-breach-notifications.pdf) says that unless there are extenuating circumstances, notice should be within 72 hours. What the notice describes: [s117](https://www.nzlii.org/nz/legis/consol_act/pa2020108/s117.html). |
| AU-NDB-26WH | An Australian suspected data breach has no completed assessment. Due 30 days after awareness. | Privacy Act 1988 (Cth) s26WH(2). [OAIC overview of the NDB scheme](https://www.oaic.gov.au/__data/assets/pdf_file/0011/5213/the-ndb-scheme-an-overview.pdf) |
| AU-NDB-26WK | An Australian breach assessed as an eligible data breach has no notice recorded. Notify the OAIC and affected individuals as soon as practicable. | Privacy Act 1988 (Cth) s26WK and s26WL |
| ASX-7.2 | The risk management framework has no recorded review in the last 365 days. | ASX Corporate Governance Principles and Recommendations, Recommendation 7.2 (review at least annually and disclose whether the review took place). The recommendations apply on an if not, why not basis. |

## House policies

These are local rules, not law. Change them with `/customise`.

| Rule | What it checks |
|---|---|
| POLICY-APPETITE | An open risk's residual score is above its category appetite and no treatment action is open. |
| POLICY-REVIEW | An open risk has no review date, or its review date has passed. |
| POLICY-OWNER | A risk has no owner. |
| POLICY-IMPORT | An imported risk is still a draft: confirm its ratings and owner, then open it with `review-risk` or `update-risk --status=open`. |
| POLICY-ATTEST | A compliance obligation is past its attestation date or has never been attested. |
| POLICY-BREACH | The latest attestation on an obligation recorded a breach. |

## How the clocks count

- The 24-hour and 72-hour clocks run from `aware_at`, the time the business became aware, stored in UTC. Record it with an offset (`2026-10-08 07:10+11:00`) when it was not UTC.
- The 20 business day clock counts Monday to Friday after the agreement date. Public holidays are not known to the database. If you need them, ask `/customise` to add a holidays table and use it in `add_business_days`.
- The 30-day NDB clock is calendar days from the date of awareness. The OAIC treats it as an outer limit, not a target.
- A finding with severity 1 is breached or needs action now. Severity 2 is due or missing. Severity 3 is a gap in the record.

## Keeping the rules current

When a standard changes, update this file and the matching part of `compliance_findings` in a new migration, together, in one change. If `/compliance` meets a rule that looks out of date, it says so and stops.

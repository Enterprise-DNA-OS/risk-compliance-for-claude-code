# Risk and Compliance for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR BUSINESS]
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [the one or two outcomes you care about]

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| What needs attention, what is late | `/attention` |
| The Monday review | `/weekly-review` |
| Are we compliant, what is breached | `/compliance` (rules and sources in `docs/compliance.md`) |
| The register, one risk | `/risks`, `/risk` |
| The heat map | `/heat-map` |
| Over appetite | `/appetite` |
| What moved since the last meeting | `/movement` |
| Ratings set before an incident | `/stale-ratings` |
| Weak or untested controls | `/control-gaps` |
| Reviews, tests or actions due | `/reviews-due`, `/controls-due`, `/actions-due` |
| An incident happened | `/log-incident`, then `/incidents` for the clocks |
| A notice to APRA, the Privacy Commissioner or the OAIC | `/draft-notification` (draft only, a person lodges it) |
| Something was notified, assessed or fixed | `/update-incident`, `/close-incident` |
| Obligations and attestations | `/obligations-due`, `/attest`, `/add-obligation` |
| CPS 230: critical operations and providers | `/resilience`, `/add-operation`, `/exercise`, `/add-provider`, `/update-provider` |
| Add or change a risk | `/add-risk`, `/update-risk`, `/review-risk`, `/add-category` |
| Controls and test results | `/add-control`, `/test-control` |
| Treatment actions | `/add-action`, `/complete-action` |
| Who is behind | `/owner-workload` |
| The committee report | `/risk-report` |
| History or a note | `/activity`, `/log` |
| Who we are, which rules apply | `/settings` |
| Bring Camms across | `/import` (read `docs/replace-camms.md` first) |
| Back everything up | `/export` |
| Change a field, the matrix or a rule | `/customise` |
| A new read-only page | `/new-view` |

If an ask fits nothing here, run the CLI directly (`npm run risk -- help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.
- Never record a regulator or privacy notice as made until a person says it was made. Drafts go to `drafts/`.
- Never decide materiality, serious harm or appetite. Ask the responsible person and record their answer.
- Times of awareness are UTC unless the operator gives an offset. Say the time back before recording it.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off Camms.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/camms

<h1 align="center">Risk and Compliance for Claude Code</h1>

<p align="center">
  <strong>The open-source risk and compliance system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Camms data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=camms">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/camms?utm_source=github&utm_medium=readme&utm_campaign=camms">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#ten-questions-camms-does-not-answer-for-you">Ten questions</a> &bull;
  <a href="#instead-of-camms">Instead of Camms</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Risk and Compliance for Claude Code does the job you pay Camms for, as a database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and it answers questions the Camms dashboard does not.

Camms is now part of Riskonnect and does not publish a price. Public contract records show councils paying tens of thousands of pounds a year for Camms risk modules, and an NSW council paying AUD 363,440 over five years for a different Camms module ([research notes](docs/research.md)).

It holds the risk register (inherent and residual ratings on your own five by five matrix, appetite per category), controls and their tests, treatment actions, incidents and near misses, the compliance obligations register with attestations, and the APRA CPS 230 records: critical operations, tolerance levels, continuity exercises and material service providers. It is built for councils, not-for-profits, advice and professional firms, and the super funds, insurers, credit unions and mutuals that have had to meet CPS 230 since 1 July 2025.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=camms).

## The weekly rituals

| When | Ask | Command |
|---|---|---|
| Monday | What needs a person this week? | `/weekly-review`, `/attention` |
| Any incident | What notice clocks are running? | `/log-incident`, `/incidents`, `/draft-notification` |
| Quarterly | Which risk reviews and control tests are due? | `/reviews-due`, `/controls-due`, `/review-risk`, `/test-control` |
| Before the committee | What moved, what is over appetite, what is breached? | `/risk-report`, `/movement`, `/appetite`, `/heat-map` |
| Yearly | Have we exercised every critical operation and attested every obligation? | `/resilience`, `/obligations-due`, `/attest`, `/exercise` |

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/risk-compliance-for-claude-code.git
cd risk-compliance-for-claude-code
npm install
npm run demo
```

The demo is Tasman Community Mutual, a fictional APRA-regulated mutual with a card outage still inside its notice window, a privacy breach past its 30-day assessment, a provider change APRA has not heard about and a risk over appetite with nothing being done. Open the folder in Claude Code and type `/attention` first.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee. Then `npm run risk -- settings --name="Your Business" --jurisdiction=NZ --apra-regulated=false --actor="You"`.

## Ten questions Camms does not answer for you

Each one runs against the demo data today.

1. Which risks sit over appetite with no treatment under way? `/appetite`
2. Which incidents have an APRA notice clock running, and when does it end? `/incidents`
3. Which material service provider agreements changed without a notice to APRA? `/compliance`
4. Which critical operations have gone more than a year without a continuity exercise? `/resilience`
5. Which risks had an incident after their last review? `/stale-ratings`
6. Which controls are ineffective or never tested, and which risks rely on them? `/control-gaps`
7. Which residual ratings moved since the last committee meeting, and why? `/movement`
8. Which privacy breaches still need an assessment or a notice? `/compliance`
9. Which compliance obligations are overdue for attestation or last recorded a breach? `/obligations-due`
10. Who holds the most overdue reviews, tests and actions? `/owner-workload`

## The commands

43 slash commands in `.claude/commands`, each driving one CLI command (`npm run risk -- <command>`, `--json` for machines).

| Command | What it does |
|---|---|
| `/attention` | Everything late, over appetite, unowned or quiet, in one list |
| `/weekly-review` | The Monday review: clocks and breaches, overdue actions, reviews and tests due, appetite |
| `/compliance` | Every rule finding, breached first, with the rule cited |
| `/risks`, `/risk` | The register, or one risk with controls, actions, incidents and rating history |
| `/heat-map` | Open risks on the likelihood by consequence grid, residual or inherent |
| `/appetite` | Risks over their category appetite and whether treatment is under way |
| `/movement` | Residual ratings that moved since a date |
| `/stale-ratings` | Risks with an incident since their last review |
| `/control-gaps` | Controls that are ineffective, partly effective or never tested |
| `/reviews-due`, `/controls-due`, `/actions-due` | The review, testing and treatment calendars |
| `/incidents` | Open incidents with the APRA 24 and 72 hour clocks and the privacy clocks |
| `/obligations-due` | Obligations due for attestation, and recorded breaches |
| `/resilience` | Critical operations, tolerance levels, exercises and material service providers |
| `/owner-workload` | Overdue items by owner |
| `/risk-report` | The risk committee report, drafted to `drafts/` |
| `/draft-notification` | An internal draft notice to APRA, the NZ Privacy Commissioner or the OAIC, to `drafts/`, never sent |
| `/add-risk`, `/update-risk`, `/review-risk`, `/add-category` | Keep the register |
| `/add-control`, `/test-control` | Controls and their test evidence |
| `/add-action`, `/complete-action` | Treatment and incident actions |
| `/log-incident`, `/update-incident`, `/close-incident` | The incident register and its notices |
| `/add-obligation`, `/attest` | The compliance obligations register |
| `/add-operation`, `/exercise`, `/add-provider`, `/update-provider` | CPS 230 records |
| `/settings`, `/log`, `/activity` | Who this is for, which rules apply, and the history |
| `/import`, `/export` | Bring Camms across; back everything up |
| `/customise`, `/new-view` | Make it yours: fields, matrix, rules, views |

## Paperwork, views and checks

Change `brand.json` once. `npm run docs` renders a risk profile for every open risk, an incident report for every incident and the compliance obligations register. `npm run view` renders the risk week, the register and the resilience page. `/risk-report` writes the committee report.

[docs/compliance.md](docs/compliance.md) lists every rule with its source: APRA CPS 230 paragraphs 30, 32, 33, 38, 42, 43, 45 and 59, the NZ Privacy Act 2020 s114, the AU Privacy Act 1988 s26WH, s26WK and s26WL, and ASX Recommendation 7.2, plus the house policies you can change. It is a record checker, not legal advice.

## Your first hour: ten things to ask for

1. Put our name, logo and colours on the reports.
2. Set us up as a New Zealand council, not APRA-regulated.
3. Replace the risk matrix with ours: our labels and our rating bands.
4. Add our risk categories with the appetite the board approved.
5. Test our Camms export without saving anything.
6. Show me every risk owned by someone who has left.
7. Add a "risk trend" field and show it on the register.
8. Add our public holidays to the business day count.
9. Draft the risk committee report since our last meeting on the 14th.
10. Build a read-only page for the audit and risk committee.

## Instead of Camms

Export your risk register report from Camms as CSV, then:

```bash
npm run risk -- import camms --file=register.csv --actor="Your name" --dry-run
npm run risk -- import camms --file=register.csv --actor="Your name"
```

Risks arrive as drafts with the original row kept, repeats change nothing, and a row that changed since the last import stops the run. Map your own headings with `--map`. Controls, actions, incidents and attestations are separate reports. Full steps and what does not carry over: [docs/replace-camms.md](docs/replace-camms.md).

## Verification

`npm test` uses a temporary database and runs all 42 CLI commands, every CPS 230, privacy and house rule turning on and off, the incident clocks, closing rules, import dry runs, repeats, rollback and mapping, the drafts, the export and the escaped HTML pages. Set `TEST_DATABASE_URL` to a new, empty Postgres to run the same suite there. GitHub checks run Linux, Windows and Postgres.

## Architecture

```
risk-compliance-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  scripts/risk.mjs          the one CLI: npm run risk -- <command>
  supabase/migrations/      plain SQL schema, views and the rule checks
  supabase/seed.sql         demo data
  docs/                     the rules and sources, the Camms guide, the research
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Risk and Compliance for Claude Code for your business, migrates your Camms data, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=camms)
- Read more: [enterprisedna.co/omni/instead-of/camms](https://enterprisedna.co/omni/instead-of/camms?utm_source=github&utm_medium=readme&utm_campaign=camms)

## License

MIT. Copyright (c) 2026 Enterprise DNA. Not affiliated with Camms, Riskonnect or Anthropic. Hosting and agent use have separate costs.

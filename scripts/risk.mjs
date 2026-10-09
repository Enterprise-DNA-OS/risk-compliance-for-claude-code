#!/usr/bin/env node
// The one CLI. Every slash command in .claude/commands drives this file.
//   npm run risk -- <command> [--option=value] [--json]
import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb, REPO_ROOT} from './lib/db.mjs';
import {parseCsv, pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const commands = {
  help: 'Show commands',
  risks: 'The risk register: optional --category --owner --rating',
  risk: 'One risk with its controls, actions, incidents and review history: --risk',
  'heat-map': 'Open risks on the likelihood by consequence grid: optional --inherent',
  appetite: 'Risks whose residual rating sits over the category appetite',
  movement: 'Residual ratings that changed since a date: --since=YYYY-MM-DD (default 90 days ago)',
  'stale-ratings': 'Risks with an incident since their last review',
  'control-gaps': 'Risks relying on controls that are ineffective, partly effective or never tested',
  'reviews-due': 'Risk reviews due: --days=30',
  'controls-due': 'Control tests due: --days=30',
  'actions-due': 'Open treatment and incident actions: --days=14',
  incidents: 'Open incidents with every notice clock that is running',
  'obligations-due': 'Compliance obligations due for attestation, and recorded breaches: --days=30',
  resilience: 'Critical operations, tolerance levels, exercises and material service providers (CPS 230)',
  compliance: 'Every rule finding, breached first, with the rule cited',
  attention: 'Everything late, over appetite, unowned or quiet, in one list',
  'owner-workload': 'Overdue reviews, tests, actions and attestations by owner',
  activity: 'Recorded history: optional --record',
  'weekly-review': 'Compliance, incidents, actions, reviews and tests in one report',
  'risk-report': 'Write the risk committee report to drafts/: optional --since',
  'draft-notification': 'Write an internal draft of a regulator or privacy notice to drafts/: --incident --to=apra|opc|oaic',
  settings: 'Show or change the organisation: optional --name --jurisdiction --apra-regulated --asx-listed --framework-reviewed --actor',
  'add-category': '--name --appetite --review-every --actor',
  'add-risk': '--reference --title --category --owner --likelihood --consequence --actor; optional --description --residual-likelihood --residual-consequence --next-review',
  'update-risk': '--risk --actor with changed fields: --title --description --category --owner --status --next-review',
  'review-risk': '--risk --residual-likelihood --residual-consequence --note --actor; optional --date --next-review',
  'add-control': '--risk --reference --title --owner --actor; optional --kind --test-every',
  'test-control': '--risk --control --result=effective|partially-effective|ineffective --evidence --actor; optional --date --note',
  'add-action': '--reference --title --owner --due --actor and --risk or --incident',
  'complete-action': '--action --evidence --actor; optional --date',
  'log-incident': '--reference --title --aware --actor; optional --occurred --kind --severity --owner --risk --operation --description --material-impact --outside-tolerance --privacy=NZ|AU',
  'update-incident': '--incident --actor with changed fields: --risk --operation --severity --owner --material-impact --outside-tolerance --regulator-notified --privacy-assessed --privacy-notifiable --privacy-notified --root-cause',
  'close-incident': '--incident --root-cause --actor; optional --date',
  'add-obligation': '--reference --title --source --owner --actor; optional --attest-every',
  attest: '--obligation --outcome=compliant|partial|breach --evidence --actor; optional --date --note',
  'add-operation': '--reference --name --owner --actor; optional --max-outage-hours --max-data-loss-hours --service-level',
  exercise: '--operation --kind=exercise|bcp-review --actor; optional --date',
  'add-provider': '--reference --name --service --owner --actor; optional --material --operation --agreement-changed',
  'update-provider': '--provider --actor with changed fields: --material --operation --agreement-changed --regulator-notified --reviewed --status',
  log: '--record --note --actor',
  import: 'camms --file=export.csv --actor; optional --map=columns.json --dry-run',
  export: 'Write every record to a JSON backup in exports/',
};

// ------------------------------------------------------------------ input checks

const required = (o, k) => { if (typeof o[k] !== 'string' || !o[k].trim()) throw Error(`--${k} is required`); return o[k].trim(); };
const today = () => new Date().toISOString().slice(0, 10);
export function date(value, label = 'date', nullable = true) {
  if ((value === null || value === undefined || value === '') && nullable) return null;
  const s = String(value ?? '').trim();
  const t = Date.parse(`${s}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(t) || new Date(t).toISOString().slice(0, 10) !== s) throw Error(`${label} must be a real ISO date (YYYY-MM-DD)`);
  return s;
}
const safeDate = date;
export function timestamp(value, label) {
  const s = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${safeDate(s, label, false)}T00:00:00Z`;
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:?\d{2})?$/.test(s) || !Number.isFinite(Date.parse(s.replace(' ', 'T')))) throw Error(`${label} must be YYYY-MM-DD or YYYY-MM-DD HH:MM (UTC unless an offset is given)`);
  return new Date(s.replace(' ', 'T') + (/(Z|[+-]\d{2}:?\d{2})$/.test(s) ? '' : 'Z')).toISOString();
}
const bool = (v, label) => {
  if (v === true || ['true', 'yes', 'y', '1'].includes(String(v).toLowerCase())) return true;
  if (['false', 'no', 'n', '0'].includes(String(v).toLowerCase())) return false;
  throw Error(`--${label} must be true or false`);
};
const intIn = (v, lo, hi, label) => { const s = String(v ?? ''); if (!/^\d+$/.test(s) || Number(s) < lo || Number(s) > hi) throw Error(`--${label} must be a whole number from ${lo} to ${hi}`); return Number(s); };
const hoursValue = (v, label) => { const s = String(v ?? ''); if (!/^\d{1,5}(\.\d{1,2})?$/.test(s)) throw Error(`--${label} must be a number of hours`); return s; };
const days = (o, dflt) => intIn(o.days ?? String(dflt), 0, 3660, 'days');
const oneOf = (v, choices, label) => { if (!choices.includes(v)) throw Error(`--${label} must be ${choices.join('|')}`); return v; };
function args(argv) {
  const o = {}, p = [];
  for (const a of argv) {
    if (!a.startsWith('--')) { p.push(a); continue; }
    const i = a.indexOf('='); const k = a.slice(2, i < 0 ? undefined : i);
    if (Object.hasOwn(o, k)) throw Error(`Repeated --${k}`);
    o[k] = i < 0 ? true : a.slice(i + 1);
  }
  return {o, p};
}

// Likelihood and consequence accept 1-5 or the scale label ("Likely", "Major").
const SYNONYMS = {likelihood: {'almost certain': 5, 'very likely': 5, likely: 4, possible: 3, unlikely: 2, rare: 1, 'very unlikely': 1},
  consequence: {catastrophic: 5, extreme: 5, severe: 5, critical: 5, major: 4, significant: 4, moderate: 3, minor: 2, insignificant: 1, negligible: 1}};
export async function level(db, kind, value, label) {
  const s = String(value ?? '').trim();
  if (/^[1-5]$/.test(s)) return Number(s);
  const m = s.match(/^([1-5])\s*[-:.)]/); if (m) return Number(m[1]);
  const rows = await db.query(`select level from ${kind === 'likelihood' ? 'likelihood_scale' : 'consequence_scale'} where lower(label)=lower($1)`, [s]);
  if (rows.length) return rows[0].level;
  const hit = SYNONYMS[kind][s.toLowerCase()]; if (hit) return hit;
  throw Error(`${label} must be 1-5 or a ${kind} label (${Object.keys(SYNONYMS[kind]).join(', ')})`);
}

// ------------------------------------------------------------------ records

const KINDS = {
  risks: {label: 'title', audit: 'risk'},
  controls: {label: 'title', audit: 'control'},
  actions: {label: 'title', audit: 'action'},
  incidents: {label: 'title', audit: 'incident'},
  obligations: {label: 'title', audit: 'obligation'},
  critical_operations: {label: 'name', audit: 'operation'},
  service_providers: {label: 'name', audit: 'provider'},
};
// Exact id or reference first, then a unique partial id or name match. Ambiguous lists and fails.
export async function resolve(db, kind, search, parent = null) {
  if (!KINDS[kind]) throw Error('Unknown record type');
  if (typeof search !== 'string' || !search.trim()) throw Error('Record reference is required');
  const label = KINDS[kind].label; const values = [search.trim()];
  const scope = parent ? ' and risk_id=$2' : ''; if (parent) values.push(parent);
  const exact = await db.query(`select * from ${kind} where (id::text=lower($1) or lower(reference)=lower($1))${scope}`, values);
  if (exact.length === 1) return exact[0];
  const rows = await db.query(`select * from ${kind} where (starts_with(id::text,lower($1)) or strpos(lower(${label}),lower($1))>0)${scope} order by reference`, values);
  if (rows.length === 1) return rows[0];
  throw Error(rows.length ? `Ambiguous ${kind.replace('_', ' ')}:\n${rows.map(r => `${r.id}  ${r.reference}  ${r[label]}`).join('\n')}` : `No matching ${kind.replace('_', ' ')}: ${search}`);
}
async function audit(db, kind, ref, actor, action, note = '') { await db.query('insert into activity(record_kind,record_ref,actor,action,note) values($1,$2,$3,$4,$5)', [kind, ref, actor, action, note]); }
async function transaction(db, fn, dry = false) { await db.exec('begin'); try { const r = await fn(); await db.exec(dry ? 'rollback' : 'commit'); return r; } catch (e) { await db.exec('rollback'); throw e; } }
async function insert(db, t, data) { const k = Object.keys(data); return (await db.query(`insert into ${t}(${k.join(',')}) values(${k.map((_, i) => `$${i + 1}`).join(',')}) returning *`, Object.values(data)))[0]; }
async function update(db, t, id, data) { const k = Object.keys(data); if (!k.length) throw Error('No changed fields supplied'); return (await db.query(`update ${t} set ${k.map((c, i) => `${c}=$${i + 1}`).join(',')} where id=$${k.length + 1} returning *`, [...Object.values(data), id]))[0]; }
async function category(db, name) { const r = await db.query('select name from risk_categories where lower(name)=lower($1)', [name]); if (!r.length) { const all = await db.query('select name from risk_categories order by name'); throw Error(`Unknown category "${name}". Known: ${all.map(x => x.name).join(', ')}. Add one with add-category.`); } return r[0].name; }
function writeDraft(prefix, text) { const dir = path.resolve(process.env.OUTPUT_DIR || REPO_ROOT, 'drafts'); fs.mkdirSync(dir, {recursive: true}); const file = path.join(dir, `${prefix}-${today()}-${randomUUID().slice(0, 8)}.md`); fs.writeFileSync(file, text, {flag: 'wx'}); return file; }

// ------------------------------------------------------------------ import (Camms risk register export)

export const importFields = {
  source_id: ['Risk ID', 'Risk Id', 'ID'], reference: ['Risk Code', 'Risk Reference', 'Risk Number', 'Risk ID'], title: ['Risk Title', 'Risk Name', 'Title', 'Risk'],
  description: ['Risk Description', 'Description'], category: ['Risk Category', 'Category'], owner: ['Risk Owner', 'Responsible Officer', 'Owner'],
  inherent_likelihood: ['Inherent Likelihood', 'Inherent Risk Likelihood'], inherent_consequence: ['Inherent Consequence', 'Inherent Risk Consequence'],
  residual_likelihood: ['Residual Likelihood', 'Current Likelihood'], residual_consequence: ['Residual Consequence', 'Current Consequence'],
  next_review: ['Next Review Date', 'Review Date'],
};
function parseImportDate(v, label) {
  const s = String(v || '').trim(); if (!s) return null;
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // Camms reports in NZ and AU print day first
  return safeDate(dmy ? `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}` : s, label, true);
}
async function importCamms(db, o) {
  const actor = required(o, 'actor'), file = required(o, 'file');
  const rows = parseCsv(fs.readFileSync(file, 'utf8')); if (!rows.length) throw Error('CSV has no records');
  let map = {};
  if (o.map) {
    map = JSON.parse(fs.readFileSync(required(o, 'map'), 'utf8'));
    if (!map || typeof map !== 'object' || Array.isArray(map)) throw Error('Column map must be an object');
    for (const [k, v] of Object.entries(map)) if (!(k in importFields) || typeof v !== 'string' || !v.trim()) throw Error(`Unknown or invalid map field: ${k}`);
    for (const column of Object.values(map)) if (!Object.keys(rows[0]).some(k => k.toLowerCase() === column.toLowerCase())) throw Error(`Mapped column missing: ${column}`);
  }
  const seen = new Set(); const input = []; let residualDefaulted = 0;
  for (const [i, row] of rows.entries()) {
    const read = k => String(map[k] ? pick(row, map[k]) : pick(row, ...importFields[k])).trim();
    const source_id = read('source_id'), title = read('title');
    if (!source_id || !title) throw Error(`Row ${i + 2}: a risk ID and title are required; map your headings with --map`);
    if (seen.has(source_id.toLowerCase())) throw Error(`Row ${i + 2}: duplicate risk ID ${source_id}`); seen.add(source_id.toLowerCase());
    const il = await level(db, 'likelihood', read('inherent_likelihood'), `Row ${i + 2} inherent likelihood`);
    const ic = await level(db, 'consequence', read('inherent_consequence'), `Row ${i + 2} inherent consequence`);
    let rl = read('residual_likelihood'), rc = read('residual_consequence');
    if (!rl || !rc) { residualDefaulted++; rl = il; rc = ic; } else { rl = await level(db, 'likelihood', rl, `Row ${i + 2} residual likelihood`); rc = await level(db, 'consequence', rc, `Row ${i + 2} residual consequence`); }
    const cat = read('category'); if (!cat) throw Error(`Row ${i + 2}: a risk category is required`);
    const sorted = Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b)));
    const data = {reference: read('reference') || `CAMMS-${source_id}`, title, description: read('description'), category: await category(db, cat), owner: read('owner'), status: 'draft',
      inherent_likelihood: il, inherent_consequence: ic, residual_likelihood: rl, residual_consequence: rc, next_review_on: parseImportDate(read('next_review'), `Row ${i + 2} next review`),
      source_id, source_row: sorted};
    data.source_hash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    input.push(data);
  }
  return transaction(db, async () => {
    let added = 0, unchanged = 0;
    for (const data of input) {
      const old = (await db.query('select source_hash from risks where source_id=$1', [data.source_id]))[0];
      if (old) { if (old.source_hash !== data.source_hash) throw Error(`Source risk ${data.source_id} changed since the last import. Reconcile it by hand before re-importing.`); unchanged++; continue; }
      const r = await insert(db, 'risks', data); await audit(db, 'risk', r.reference, actor, 'import', 'Camms export imported as a draft; original fields kept'); added++;
    }
    return {added, unchanged, residual_defaulted_to_inherent: residualDefaulted, dry_run: Boolean(o['dry-run'])};
  }, Boolean(o['dry-run']));
}

// ------------------------------------------------------------------ reports

async function heatMap(db, inherent) {
  const [lk, cs] = [await db.query('select level,label from likelihood_scale order by level desc'), await db.query('select level,label from consequence_scale order by level')];
  const pre = inherent ? 'inherent' : 'residual';
  const cells = await db.query(`select ${pre}_likelihood l, ${pre}_consequence c, string_agg(reference, ' ' order by reference) refs from risks where status <> 'closed' group by 1,2`);
  return lk.map(l => ({likelihood: `${l.level} ${l.label}`, ...Object.fromEntries(cs.map(c => [`${c.level} ${c.label}`, cells.find(x => x.l === l.level && x.c === c.level)?.refs || '']))}));
}
const compliance = db => db.query('select severity,kind,reference,rule,finding from compliance_findings order by severity,rule,reference');

async function riskReport(db, o) {
  const since = safeDate(o.since ?? new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10), 'since', false);
  const org = (await db.query('select * from organisation'))[0] || {name: 'Your Business'};
  const register = await db.query('select reference,title,owner,inherent_score,residual_score,rating,appetite_score,over_appetite from risk_register where status=$1 order by residual_score desc,reference', ['open']);
  const moves = await run(db, ['movement', `--since=${since}`]);
  const inc = await db.query("select reference,title,severity,status,aware_at::date as aware_on from incidents where aware_at::date >= $1 order by aware_at", [since]);
  const findings = await compliance(db);
  const overdue = await db.query('select record,reference,title,owner,due_on,days_left from action_queue where days_left<0 order by due_on');
  const obl = await db.query('select reference,title,owner,last_attested_on,last_outcome,next_due_on from obligation_queue order by next_due_on');
  const text = `# Risk committee report: ${org.name}\n\nDRAFT for the committee chair. Prepared ${today()}, covering ${since} to ${today()}. Check every figure against the register before circulating.\n\n` +
    `## Summary\n\n- ${register.length} open risks, ${register.filter(r => r.over_appetite).length} over appetite.\n- ${moves.length} residual ratings changed in the period.\n- ${inc.length} incidents and near misses recorded in the period.\n- ${findings.filter(f => f.severity === 1).length} rule findings breached or needing action now, ${findings.length} in total.\n- ${overdue.length} treatment actions overdue.\n\n` +
    `## Heat map (residual)\n\n${human(await heatMap(db, false))}\n\n## Risks over appetite\n\n${human(register.filter(r => r.over_appetite))}\n\n## Rating movement since ${since}\n\n${human(moves)}\n\n` +
    `## Incidents in the period\n\n${human(inc)}\n\n## Rule findings\n\n${human(findings)}\n\n## Overdue treatment actions\n\n${human(overdue)}\n\n## Compliance attestations\n\n${human(obl)}\n\n## Decisions for the committee\n\n- Accept, treat or escalate each risk over appetite.\n- Note the notice clocks above and who owns each one.\n`;
  return {file: writeDraft('risk-report', text), open_risks: register.length, findings: findings.length};
}

async function draftNotification(db, o) {
  const i = await resolve(db, 'incidents', required(o, 'incident'));
  const to = oneOf(required(o, 'to'), ['apra', 'opc', 'oaic'], 'to');
  const org = (await db.query('select * from organisation'))[0] || {name: 'Your Business'};
  const op = i.critical_operation_id ? (await db.query('select reference,name,max_outage_hours from critical_operations where id=$1', [i.critical_operation_id]))[0] : null;
  const acts = await db.query('select reference,title,owner,due_on,status from actions where incident_id=$1 order by due_on', [i.id]);
  const head = `DRAFT. Nothing has been sent. The responsible officer checks every fact, the recipient and the lodgement channel before anything goes to a regulator.\n\nOrganisation: ${org.name}\nIncident: ${i.reference} ${i.title}\nBecame aware: ${new Date(i.aware_at).toISOString().replace('T', ' ').slice(0, 16)} UTC\n`;
  const body = {
    apra: `# Draft APRA notification\n\n${head}\nRule: CPS 230 para 33 (material operational risk incident, within 72 hours)${i.outside_tolerance ? ' and para 42 (critical operation disrupted outside tolerance, within 24 hours)' : ''}.\n\n## Nature of the disruption\n\n${i.description || '[describe]'}\n${op ? `\nCritical operation: ${op.reference} ${op.name} (tolerance ${op.max_outage_hours ?? '[not set]'} hours)\n` : ''}\n## Action taken\n\n${human(acts)}\n\n## Likely impact on business operations\n\n[impact on members, finances and critical operations]\n\n## Timeframe for returning to normal operations\n\n[expected time]\n`,
    opc: `# Draft notification to the NZ Privacy Commissioner\n\n${head}\nRule: Privacy Act 2020 s114, notify as soon as practicable after becoming aware of a notifiable privacy breach. Section 117 sets out what the notice describes.\n\n## What happened\n\n${i.description || '[describe]'}\n\n## Steps taken or planned in response\n\n${human(acts)}\n\n## Whether affected people have been told\n\n[yes or no, and when]\n\n## Contact person\n\n[name and contact details]\n`,
    oaic: `# Draft statement for the OAIC\n\n${head}\nRule: Privacy Act 1988 s26WK. The statement covers the entity's identity and contact details, a description of the eligible data breach, the kinds of information concerned, and recommended steps for individuals.\n\n## Description of the breach\n\n${i.description || '[describe]'}\n\n## Kinds of information concerned\n\n[list]\n\n## Recommended steps for individuals\n\n[steps]\n\n## Steps taken\n\n${human(acts)}\n`,
  }[to];
  const file = writeDraft(`notification-${to}-${i.reference.toLowerCase()}`, body);
  return {file, incident: i.reference, to};
}

// ------------------------------------------------------------------ run

const ALLOWED = {
  help: [], risks: ['category', 'owner', 'rating'], risk: ['risk'], 'heat-map': ['inherent'], appetite: [], movement: ['since'], 'stale-ratings': [], 'control-gaps': [],
  'reviews-due': ['days'], 'controls-due': ['days'], 'actions-due': ['days'], incidents: [], 'obligations-due': ['days'], resilience: [], compliance: [], attention: [],
  'owner-workload': [], activity: ['record'], 'weekly-review': [], 'risk-report': ['since'], 'draft-notification': ['incident', 'to'],
  settings: ['name', 'jurisdiction', 'apra-regulated', 'asx-listed', 'framework-reviewed', 'actor'], 'add-category': ['name', 'appetite', 'review-every', 'actor'],
  'add-risk': ['reference', 'title', 'category', 'owner', 'likelihood', 'consequence', 'residual-likelihood', 'residual-consequence', 'description', 'next-review', 'actor'],
  'update-risk': ['risk', 'title', 'description', 'category', 'owner', 'status', 'next-review', 'actor'],
  'review-risk': ['risk', 'residual-likelihood', 'residual-consequence', 'note', 'date', 'next-review', 'actor'],
  'add-control': ['risk', 'reference', 'title', 'owner', 'kind', 'test-every', 'actor'], 'test-control': ['risk', 'control', 'result', 'evidence', 'date', 'note', 'actor'],
  'add-action': ['risk', 'incident', 'reference', 'title', 'owner', 'due', 'actor'], 'complete-action': ['action', 'evidence', 'date', 'actor'],
  'log-incident': ['reference', 'title', 'aware', 'occurred', 'kind', 'severity', 'owner', 'risk', 'operation', 'description', 'material-impact', 'outside-tolerance', 'privacy', 'actor'],
  'update-incident': ['incident', 'risk', 'operation', 'severity', 'owner', 'material-impact', 'outside-tolerance', 'regulator-notified', 'privacy-assessed', 'privacy-notifiable', 'privacy-notified', 'root-cause', 'actor'],
  'close-incident': ['incident', 'root-cause', 'date', 'actor'], 'add-obligation': ['reference', 'title', 'source', 'owner', 'attest-every', 'actor'],
  attest: ['obligation', 'outcome', 'evidence', 'date', 'note', 'actor'], 'add-operation': ['reference', 'name', 'owner', 'max-outage-hours', 'max-data-loss-hours', 'service-level', 'actor'],
  exercise: ['operation', 'kind', 'date', 'actor'], 'add-provider': ['reference', 'name', 'service', 'owner', 'material', 'operation', 'agreement-changed', 'actor'],
  'update-provider': ['provider', 'material', 'operation', 'agreement-changed', 'regulator-notified', 'reviewed', 'status', 'actor'], log: ['record', 'note', 'actor'],
  import: ['file', 'map', 'dry-run', 'actor'], export: [],
};

export async function run(db, argv) {
  const {o, p} = args(argv); const command = p[0] || 'help';
  if (!(command in commands)) throw Error(`Unknown command ${command}. Use help.`);
  for (const k of Object.keys(o)) if (k !== 'json' && !ALLOWED[command].includes(k)) throw Error(`Unknown option --${k} for ${command}`);
  for (const k of ['json', 'dry-run', 'inherent']) if (Object.hasOwn(o, k) && o[k] !== true) throw Error(`--${k} is a bare flag`);
  if (p.length > (command === 'import' ? 2 : 1)) throw Error('Unexpected positional argument');
  const pastOrToday = (v, label) => { const d = safeDate(v ?? today(), label, false); if (d > today()) throw Error(`--${label} cannot be in the future`); return d; };

  switch (command) {
    case 'help': return Object.entries(commands).map(([command, usage]) => ({command, usage}));
    case 'risks': {
      const w = [], v = [];
      if (o.category) { v.push(o.category); w.push(`lower(category)=lower($${v.length})`); }
      if (o.owner) { v.push(o.owner); w.push(`lower(owner)=lower($${v.length})`); }
      if (o.rating) { v.push(o.rating); w.push(`lower(rating)=lower($${v.length})`); }
      return db.query(`select reference,title,category,owner,status,inherent_score as inherent,residual_score as residual,rating,appetite_score as appetite,over_appetite,next_review_on,weak_controls,open_actions from risk_register ${w.length ? 'where ' + w.join(' and ') : ''} order by residual_score desc,reference`, v);
    }
    case 'risk': {
      const r = await resolve(db, 'risks', required(o, 'risk'));
      return {risk: (await db.query('select * from risk_register where id=$1', [r.id]))[0] || r, description: r.description,
        controls: await db.query('select reference,title,owner,kind,effectiveness,last_tested_on,test_every_days from controls where risk_id=$1 order by reference', [r.id]),
        actions: await db.query('select reference,title,owner,due_on,status,completed_on from actions where risk_id=$1 order by due_on', [r.id]),
        incidents: await db.query('select reference,title,severity,status,aware_at::date as aware_on from incidents where risk_id=$1 order by aware_at desc', [r.id]),
        reviews: await db.query('select reviewed_on,reviewer,residual_likelihood*residual_consequence as residual,note from risk_reviews where risk_id=$1 order by reviewed_on desc', [r.id]),
        activity: await db.query("select created_at,actor,action,note from activity where record_kind='risk' and record_ref=$1 order by created_at desc,id desc", [r.reference])};
    }
    case 'heat-map': return heatMap(db, Boolean(o.inherent));
    case 'appetite': return db.query("select reference,title,category,owner,residual_score as residual,appetite_score as appetite,residual_score-appetite_score as over_by,open_actions,overdue_actions from risk_register where over_appetite and status='open' order by over_by desc,reference");
    case 'movement': {
      const since = safeDate(o.since ?? new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10), 'since', false);
      return db.query(`with ordered as (
          select r.reference, r.title, v.reviewed_on, v.residual_likelihood*v.residual_consequence as score,
            lag(v.residual_likelihood*v.residual_consequence) over (partition by v.risk_id order by v.reviewed_on, v.created_at) as before
          from risk_reviews v join risks r on r.id = v.risk_id)
        select reference,title,reviewed_on,before,score as after,case when score>before then 'up' else 'down' end as direction
        from ordered where reviewed_on >= $1 and before is not null and score <> before order by reviewed_on desc,reference`, [since]);
    }
    case 'stale-ratings': return db.query(`select r.reference,r.title,r.owner,r.last_reviewed_on,max(i.aware_at)::date as latest_incident,count(i.id)::int as incidents_since_review,r.residual_score as residual
      from risk_register r join incidents i on i.risk_id=r.id and (r.last_reviewed_on is null or i.aware_at::date > r.last_reviewed_on)
      group by r.reference,r.title,r.owner,r.last_reviewed_on,r.residual_score order by latest_incident desc`);
    case 'control-gaps': return db.query(`select r.reference as risk,r.title as risk_title,r.residual_score as residual,c.reference as control,c.title as control_title,c.owner,c.effectiveness,c.last_tested_on
      from controls c join risk_register r on r.id=c.risk_id where c.status='active' and c.effectiveness<>'effective' order by r.residual_score desc,r.reference,c.reference`);
    case 'reviews-due': return db.query('select reference,title,owner,rating,last_reviewed_on,next_review_on,review_days_left as days_left from risk_register where status=$2 and (next_review_on is null or next_review_on<=current_date+$1::int) order by next_review_on nulls first,reference', [days(o, 30), 'open']);
    case 'controls-due': return db.query('select risk,reference,title,owner,effectiveness,last_tested_on,next_test_on,days_left from control_queue where next_test_on<=current_date+$1::int order by next_test_on,risk,reference', [days(o, 30)]);
    case 'actions-due': return db.query('select record,reference,title,owner,due_on,days_left from action_queue where due_on<=current_date+$1::int order by due_on,reference', [days(o, 14)]);
    case 'incidents': return db.query(`select reference,title,kind,severity,owner,days_open,risk,critical_operation,
        to_char(cps230_42_due_at,'YYYY-MM-DD HH24:MI') as apra_24h_due, to_char(cps230_33_due_at,'YYYY-MM-DD HH24:MI') as apra_72h_due,
        ndb_assess_by, case when privacy_breach then privacy_jurisdiction end as privacy, privacy_notifiable, open_actions
      from incident_queue order by coalesce(cps230_42_due_at,cps230_33_due_at,ndb_assess_by::timestamptz,aware_at+interval '100 years'),aware_at`);
    case 'obligations-due': return db.query('select reference,title,source,owner,last_attested_on,last_outcome,next_due_on,days_left from obligation_queue where next_due_on<=current_date+$1::int or last_outcome=$2 order by next_due_on,reference', [days(o, 30), 'breach']);
    case 'resilience': return {
      critical_operations: await db.query(`select o.reference,o.name,o.owner,o.max_outage_hours,o.max_data_loss_hours,o.last_exercise_on,o.bcp_reviewed_on,
          (select count(*) from incidents i where i.critical_operation_id=o.id and i.outside_tolerance and i.aware_at>now()-interval '365 days')::int as breaches_12m
        from critical_operations o order by o.reference`),
      service_providers: await db.query(`select p.reference,p.name,p.service,p.owner,p.material,o.reference as operation,p.agreement_changed_on,p.regulator_notified_on,p.last_reviewed_on
        from service_providers p left join critical_operations o on o.id=p.critical_operation_id where p.status='active' order by p.material desc,p.reference`)};
    case 'compliance': return compliance(db);
    case 'attention': return db.query(`select * from (
        select 'finding' as what, reference, rule || ': ' || finding as why, severity from compliance_findings where severity=1
        union all select 'action', reference, 'Overdue by ' || (-days_left) || ' days, ' || owner, 2 from action_queue where days_left<0
        union all select 'control test', risk || '/' || reference, case when last_tested_on is null then 'Never tested' else 'Test overdue by ' || (-days_left) || ' days' end, 2 from control_queue where days_left<0 or last_tested_on is null
        union all select 'review', reference, case when next_review_on is null then 'No review date' else 'Review overdue by ' || (-review_days_left) || ' days' end, 2 from risk_register where status='open' and (next_review_on is null or review_days_left<0)
        union all select 'owner', reference, 'No risk owner', 2 from risk_register where btrim(owner)=''
        union all select 'quiet', reference, 'Rated ' || rating || ', no recorded activity for ' || coalesce((current_date-last_activity)::text,'ever') || ' days', 3 from risk_register where status='open' and rating in ('High','Extreme') and (last_activity is null or last_activity<current_date-30)
      ) x order by severity,what,reference`);
    case 'owner-workload': return db.query(`select owner,count(*) filter (where kind='review')::int as reviews,count(*) filter (where kind='test')::int as tests,count(*) filter (where kind='action')::int as actions,count(*) filter (where kind='attest')::int as attestations,count(*)::int as total_overdue from (
        select owner,'review' kind from risk_register where status='open' and review_days_left<0
        union all select owner,'test' from control_queue where days_left<0 or last_tested_on is null
        union all select owner,'action' from action_queue where days_left<0
        union all select owner,'attest' from obligation_queue where days_left<0) x group by owner order by total_overdue desc,owner`);
    case 'activity': return o.record ? db.query('select created_at,record_kind,record_ref,actor,action,note from activity where lower(record_ref)=lower($1) order by created_at desc,id desc', [String(o.record)]) : db.query('select created_at,record_kind,record_ref,actor,action,note from activity order by created_at desc,id desc limit 50');
    case 'weekly-review': {
      const out = {};
      for (const c of ['compliance', 'incidents', ['actions-due', '--days=7'], ['reviews-due', '--days=7'], ['controls-due', '--days=7'], 'appetite']) { const a = [].concat(c); out[a[0]] = await run(db, a); }
      return out;
    }
    case 'risk-report': return riskReport(db, o);
    case 'draft-notification': return draftNotification(db, o);
    case 'import': if (p[1] !== 'camms') throw Error('Supported import: camms'); return importCamms(db, o);
    case 'export': {
      const backup = {format: 'risk-compliance-for-claude-code/v1', exported_at: new Date().toISOString(), records: {}};
      for (const t of ['organisation', 'rating_bands', 'likelihood_scale', 'consequence_scale', 'risk_categories', 'risks', 'risk_reviews', 'controls', 'control_tests', 'actions', 'incidents', 'obligations', 'attestations', 'critical_operations', 'service_providers', 'activity']) backup.records[t] = await db.query(`select * from ${t}`);
      const dir = path.resolve(process.env.OUTPUT_DIR || REPO_ROOT, 'exports'); fs.mkdirSync(dir, {recursive: true});
      const file = path.join(dir, `risk-${today()}-${randomUUID().slice(0, 8)}.json`); fs.writeFileSync(file, JSON.stringify(backup, null, 2) + '\n', {flag: 'wx'});
      return {file, risks: backup.records.risks.length, incidents: backup.records.incidents.length};
    }
    case 'settings': {
      const changes = {};
      if (o.name !== undefined) changes.name = required(o, 'name');
      if (o.jurisdiction !== undefined) changes.jurisdiction = oneOf(o.jurisdiction, ['NZ', 'AU', 'other'], 'jurisdiction');
      if (o['apra-regulated'] !== undefined) changes.apra_regulated = bool(o['apra-regulated'], 'apra-regulated');
      if (o['asx-listed'] !== undefined) changes.asx_listed = bool(o['asx-listed'], 'asx-listed');
      if (o['framework-reviewed'] !== undefined) changes.framework_reviewed_on = pastOrToday(o['framework-reviewed'], 'framework-reviewed');
      if (!Object.keys(changes).length) return db.query('select name,jurisdiction,apra_regulated,asx_listed,framework_reviewed_on from organisation');
      const actor = required(o, 'actor');
      return transaction(db, async () => { await db.query('insert into organisation(id) values(true) on conflict do nothing'); const r = await update(db, 'organisation', true, changes); await audit(db, 'organisation', r.name, actor, 'settings', JSON.stringify(changes)); return r; });
    }
  }

  // Everything below writes, in one transaction, with the actor on the activity log.
  const actor = required(o, 'actor');
  return transaction(db, async () => {
    switch (command) {
      case 'add-category': {
        const r = await insert(db, 'risk_categories', {name: required(o, 'name'), appetite_score: intIn(o.appetite, 1, 25, 'appetite'), review_every_days: intIn(o['review-every'] ?? '90', 7, 730, 'review-every')});
        await audit(db, 'category', r.name, actor, command, `appetite ${r.appetite_score}`); return r;
      }
      case 'add-risk': {
        const il = await level(db, 'likelihood', required(o, 'likelihood'), '--likelihood'), ic = await level(db, 'consequence', required(o, 'consequence'), '--consequence');
        const rl = o['residual-likelihood'] ? await level(db, 'likelihood', o['residual-likelihood'], '--residual-likelihood') : il;
        const rc = o['residual-consequence'] ? await level(db, 'consequence', o['residual-consequence'], '--residual-consequence') : ic;
        if (rl * rc > il * ic) throw Error('Residual rating cannot be higher than the inherent rating');
        const cat = await category(db, required(o, 'category'));
        const every = (await db.query('select review_every_days from risk_categories where name=$1', [cat]))[0].review_every_days;
        const next = o['next-review'] ? safeDate(o['next-review'], 'next-review', false) : new Date(Date.now() + every * 864e5).toISOString().slice(0, 10);
        const r = await insert(db, 'risks', {reference: required(o, 'reference'), title: required(o, 'title'), description: o.description ? String(o.description) : '', category: cat, owner: required(o, 'owner'), status: 'open',
          inherent_likelihood: il, inherent_consequence: ic, residual_likelihood: rl, residual_consequence: rc, last_reviewed_on: today(), next_review_on: next});
        await insert(db, 'risk_reviews', {risk_id: r.id, reviewer: actor, reviewed_on: today(), residual_likelihood: rl, residual_consequence: rc, note: 'Risk added'});
        await audit(db, 'risk', r.reference, actor, command, r.title); return r;
      }
      case 'update-risk': {
        const r = await resolve(db, 'risks', required(o, 'risk')); const d = {};
        for (const k of ['title', 'description', 'owner']) if (o[k] !== undefined) d[k] = k === 'description' ? String(o[k]) : required(o, k);
        if (o.category !== undefined) d.category = await category(db, required(o, 'category'));
        if (o.status !== undefined) d.status = oneOf(o.status, ['draft', 'open', 'closed'], 'status');
        if (o['next-review'] !== undefined) d.next_review_on = safeDate(o['next-review'], 'next-review', false);
        if (d.status === 'open' && !String(d.owner ?? r.owner).trim()) throw Error('An open risk needs an owner');
        if (d.status === 'closed') { const open = await db.query("select reference from actions where risk_id=$1 and status='open'", [r.id]); if (open.length) throw Error(`Finish or move the open actions first: ${open.map(x => x.reference).join(', ')}`); }
        const u = await update(db, 'risks', r.id, d); await audit(db, 'risk', r.reference, actor, command, JSON.stringify({before: Object.fromEntries(Object.keys(d).map(k => [k, r[k]])), after: d})); return u;
      }
      case 'review-risk': {
        const r = await resolve(db, 'risks', required(o, 'risk'));
        const rl = await level(db, 'likelihood', required(o, 'residual-likelihood'), '--residual-likelihood'), rc = await level(db, 'consequence', required(o, 'residual-consequence'), '--residual-consequence');
        if (rl * rc > r.inherent_likelihood * r.inherent_consequence) throw Error('Residual rating cannot be higher than the inherent rating; re-rate the inherent risk with /customise if it has changed');
        const on = pastOrToday(o.date, 'date');
        const every = (await db.query('select review_every_days from risk_categories where name=$1', [r.category]))[0].review_every_days;
        const next = o['next-review'] ? safeDate(o['next-review'], 'next-review', false) : new Date(Date.parse(on) + every * 864e5).toISOString().slice(0, 10);
        await insert(db, 'risk_reviews', {risk_id: r.id, reviewer: actor, reviewed_on: on, residual_likelihood: rl, residual_consequence: rc, note: required(o, 'note')});
        const u = await update(db, 'risks', r.id, {residual_likelihood: rl, residual_consequence: rc, last_reviewed_on: on, next_review_on: next, ...(r.status === 'draft' && r.owner.trim() ? {status: 'open'} : {})});
        await audit(db, 'risk', r.reference, actor, command, `${r.residual_likelihood * r.residual_consequence} -> ${rl * rc}: ${o.note}`); return u;
      }
      case 'add-control': {
        const r = await resolve(db, 'risks', required(o, 'risk'));
        const c = await insert(db, 'controls', {risk_id: r.id, reference: required(o, 'reference'), title: required(o, 'title'), owner: required(o, 'owner'), kind: oneOf(o.kind ?? 'preventive', ['preventive', 'detective', 'corrective'], 'kind'), test_every_days: intIn(o['test-every'] ?? '180', 7, 1095, 'test-every')});
        await audit(db, 'risk', r.reference, actor, command, `${c.reference}: ${c.title}`); return c;
      }
      case 'test-control': {
        const r = await resolve(db, 'risks', required(o, 'risk')); const c = await resolve(db, 'controls', required(o, 'control'), r.id);
        const on = pastOrToday(o.date, 'date'); const result = oneOf(required(o, 'result'), ['effective', 'partially-effective', 'ineffective'], 'result');
        const t = await insert(db, 'control_tests', {control_id: c.id, tested_on: on, tester: actor, result, evidence: required(o, 'evidence'), note: o.note ? String(o.note) : ''});
        if (!c.last_tested_on || on >= c.last_tested_on) await update(db, 'controls', c.id, {effectiveness: result, last_tested_on: on});
        await audit(db, 'risk', r.reference, actor, command, `${c.reference} ${result}`); return t;
      }
      case 'add-action': {
        if (Boolean(o.risk) === Boolean(o.incident)) throw Error('Give exactly one of --risk or --incident');
        const parent = o.risk ? await resolve(db, 'risks', required(o, 'risk')) : await resolve(db, 'incidents', required(o, 'incident'));
        const a = await insert(db, 'actions', {risk_id: o.risk ? parent.id : null, incident_id: o.incident ? parent.id : null, reference: required(o, 'reference'), title: required(o, 'title'), owner: required(o, 'owner'), due_on: safeDate(required(o, 'due'), 'due', false)});
        await audit(db, o.risk ? 'risk' : 'incident', parent.reference, actor, command, `${a.reference}: ${a.title}`); return a;
      }
      case 'complete-action': {
        const a = await resolve(db, 'actions', required(o, 'action')); if (a.status === 'done') throw Error('Action already complete');
        const u = await update(db, 'actions', a.id, {status: 'done', completed_on: pastOrToday(o.date, 'date'), evidence: required(o, 'evidence')});
        const parent = (await db.query('select reference from risks where id=$1 union all select reference from incidents where id=$2', [a.risk_id, a.incident_id]))[0];
        await audit(db, a.risk_id ? 'risk' : 'incident', parent.reference, actor, command, `${a.reference}: ${o.evidence}`); return u;
      }
      case 'log-incident': {
        const d = {reference: required(o, 'reference'), title: required(o, 'title'), aware_at: timestamp(required(o, 'aware'), '--aware'), kind: oneOf(o.kind ?? 'incident', ['incident', 'near-miss'], 'kind'),
          severity: oneOf(o.severity ?? 'minor', ['minor', 'moderate', 'major', 'severe'], 'severity'), owner: o.owner ? required(o, 'owner') : '', description: o.description ? String(o.description) : ''};
        if (Date.parse(d.aware_at) > Date.now() + 60e3) throw Error('--aware cannot be in the future');
        if (o.occurred) d.occurred_at = timestamp(o.occurred, '--occurred');
        if (o.risk) d.risk_id = (await resolve(db, 'risks', required(o, 'risk'))).id;
        if (o.operation) d.critical_operation_id = (await resolve(db, 'critical_operations', required(o, 'operation'))).id;
        if (o['material-impact'] !== undefined) d.material_impact = bool(o['material-impact'], 'material-impact');
        if (o['outside-tolerance'] !== undefined) { d.outside_tolerance = bool(o['outside-tolerance'], 'outside-tolerance'); if (d.outside_tolerance && !d.critical_operation_id) throw Error('--outside-tolerance needs --operation'); }
        if (o.privacy !== undefined) { d.privacy_breach = true; d.privacy_jurisdiction = oneOf(o.privacy, ['NZ', 'AU'], 'privacy'); }
        const i = await insert(db, 'incidents', d); await audit(db, 'incident', i.reference, actor, command, i.title); return i;
      }
      case 'update-incident': {
        const i = await resolve(db, 'incidents', required(o, 'incident')); const d = {};
        if (o.risk !== undefined) d.risk_id = (await resolve(db, 'risks', required(o, 'risk'))).id;
        if (o.operation !== undefined) d.critical_operation_id = (await resolve(db, 'critical_operations', required(o, 'operation'))).id;
        if (o.severity !== undefined) d.severity = oneOf(o.severity, ['minor', 'moderate', 'major', 'severe'], 'severity');
        if (o.owner !== undefined) d.owner = required(o, 'owner');
        if (o['root-cause'] !== undefined) d.root_cause = required(o, 'root-cause');
        if (o['material-impact'] !== undefined) d.material_impact = bool(o['material-impact'], 'material-impact');
        if (o['outside-tolerance'] !== undefined) d.outside_tolerance = bool(o['outside-tolerance'], 'outside-tolerance');
        if (o['regulator-notified'] !== undefined) d.regulator_notified_at = timestamp(o['regulator-notified'], '--regulator-notified');
        if (o['privacy-assessed'] !== undefined) d.privacy_assessed_on = pastOrToday(o['privacy-assessed'], 'privacy-assessed');
        if (o['privacy-notifiable'] !== undefined) d.privacy_notifiable = bool(o['privacy-notifiable'], 'privacy-notifiable');
        if (o['privacy-notified'] !== undefined) d.privacy_notified_on = pastOrToday(o['privacy-notified'], 'privacy-notified');
        if ((d.privacy_assessed_on || d.privacy_notifiable !== undefined || d.privacy_notified_on) && !i.privacy_breach) throw Error('This incident is not recorded as a privacy breach');
        if (d.outside_tolerance && !(d.critical_operation_id || i.critical_operation_id)) throw Error('--outside-tolerance needs a critical operation (--operation)');
        if (d.regulator_notified_at && Date.parse(d.regulator_notified_at) < Date.parse(i.aware_at)) throw Error('Notice cannot predate the time the business became aware');
        const u = await update(db, 'incidents', i.id, d); await audit(db, 'incident', i.reference, actor, command, JSON.stringify(d)); return u;
      }
      case 'close-incident': {
        const i = await resolve(db, 'incidents', required(o, 'incident')); if (i.status === 'closed') throw Error('Incident already closed');
        const open = await db.query("select reference from actions where incident_id=$1 and status='open'", [i.id]); if (open.length) throw Error(`Finish the open actions first: ${open.map(x => x.reference).join(', ')}`);
        if ((i.material_impact || i.outside_tolerance) && !i.regulator_notified_at) throw Error('Record when APRA was notified (update-incident --regulator-notified) before closing');
        if (i.privacy_breach && (i.privacy_notifiable === null || (i.privacy_notifiable && !i.privacy_notified_on))) throw Error('Record the privacy assessment and any notice before closing');
        const u = await update(db, 'incidents', i.id, {status: 'closed', closed_on: pastOrToday(o.date, 'date'), root_cause: required(o, 'root-cause')});
        await audit(db, 'incident', i.reference, actor, command, o['root-cause']); return u;
      }
      case 'add-obligation': {
        const r = await insert(db, 'obligations', {reference: required(o, 'reference'), title: required(o, 'title'), source: required(o, 'source'), owner: required(o, 'owner'), attest_every_days: intIn(o['attest-every'] ?? '365', 7, 1095, 'attest-every')});
        await audit(db, 'obligation', r.reference, actor, command, `${r.title} (${r.source})`); return r;
      }
      case 'attest': {
        const ob = await resolve(db, 'obligations', required(o, 'obligation'));
        const a = await insert(db, 'attestations', {obligation_id: ob.id, attested_on: pastOrToday(o.date, 'date'), attested_by: actor, outcome: oneOf(required(o, 'outcome'), ['compliant', 'partial', 'breach'], 'outcome'), evidence: required(o, 'evidence'), note: o.note ? String(o.note) : ''});
        await audit(db, 'obligation', ob.reference, actor, command, a.outcome); return a;
      }
      case 'add-operation': {
        const r = await insert(db, 'critical_operations', {reference: required(o, 'reference'), name: required(o, 'name'), owner: required(o, 'owner'),
          max_outage_hours: o['max-outage-hours'] ? hoursValue(o['max-outage-hours'], 'max-outage-hours') : null, max_data_loss_hours: o['max-data-loss-hours'] ? hoursValue(o['max-data-loss-hours'], 'max-data-loss-hours') : null, min_service_level: o['service-level'] ? String(o['service-level']) : ''});
        await audit(db, 'operation', r.reference, actor, command, r.name); return r;
      }
      case 'exercise': {
        const op = await resolve(db, 'critical_operations', required(o, 'operation')); const kind = oneOf(required(o, 'kind'), ['exercise', 'bcp-review'], 'kind'); const on = pastOrToday(o.date, 'date');
        const u = await update(db, 'critical_operations', op.id, kind === 'exercise' ? {last_exercise_on: on} : {bcp_reviewed_on: on});
        await audit(db, 'operation', op.reference, actor, command, `${kind} ${on}`); return u;
      }
      case 'add-provider': {
        const d = {reference: required(o, 'reference'), name: required(o, 'name'), service: required(o, 'service'), owner: required(o, 'owner'), material: o.material !== undefined ? bool(o.material, 'material') : false};
        if (o.operation) d.critical_operation_id = (await resolve(db, 'critical_operations', required(o, 'operation'))).id;
        if (o['agreement-changed']) d.agreement_changed_on = pastOrToday(o['agreement-changed'], 'agreement-changed');
        const r = await insert(db, 'service_providers', d); await audit(db, 'provider', r.reference, actor, command, `${r.name}: ${r.service}`); return r;
      }
      case 'update-provider': {
        const p0 = await resolve(db, 'service_providers', required(o, 'provider')); const d = {};
        if (o.material !== undefined) d.material = bool(o.material, 'material');
        if (o.operation !== undefined) d.critical_operation_id = (await resolve(db, 'critical_operations', required(o, 'operation'))).id;
        if (o['agreement-changed'] !== undefined) d.agreement_changed_on = pastOrToday(o['agreement-changed'], 'agreement-changed');
        if (o['regulator-notified'] !== undefined) d.regulator_notified_on = pastOrToday(o['regulator-notified'], 'regulator-notified');
        if (o.reviewed !== undefined) d.last_reviewed_on = pastOrToday(o.reviewed, 'reviewed');
        if (o.status !== undefined) d.status = oneOf(o.status, ['active', 'exited'], 'status');
        const u = await update(db, 'service_providers', p0.id, d); await audit(db, 'provider', p0.reference, actor, command, JSON.stringify(d)); return u;
      }
      case 'log': {
        const ref = required(o, 'record');
        for (const kind of Object.keys(KINDS)) { const hit = await db.query(`select reference from ${kind} where lower(reference)=lower($1)`, [ref]); if (hit.length === 1) { await audit(db, KINDS[kind].audit, hit[0].reference, actor, 'note', required(o, 'note')); return {record: hit[0].reference, recorded: true}; } }
        throw Error(`No record with reference ${ref}`);
      }
    }
    throw Error(`Unimplemented command ${command}`);
  });
}

// ------------------------------------------------------------------ output

const HIDE = ['id', 'risk_id', 'incident_id', 'control_id', 'obligation_id', 'critical_operation_id', 'source_row', 'source_hash', 'created_at', 'updated_at'];
export function human(result) {
  if (Array.isArray(result)) {
    if (!result.length) return '  (none)';
    const cols = Object.keys(result[0]).filter(k => !HIDE.includes(k));
    return table(result, cols.map(key => ({key, label: key, width: 48, format: v => v instanceof Date ? v.toISOString().slice(0, 16).replace('T', ' ') : v && typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')})));
  }
  if (result && typeof result === 'object') return Object.entries(result).map(([k, v]) => v && typeof v === 'object' && !(v instanceof Date) ? `${k}\n${human(Array.isArray(v) ? v : [v])}` : `${k}: ${v ?? ''}`).join('\n\n');
  return String(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let db;
  try { db = await getDb(); const result = await run(db, process.argv.slice(2)); console.log(process.argv.includes('--json') ? JSON.stringify(result, null, 2) : human(result)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
  finally { if (db) await db.close(); }
}

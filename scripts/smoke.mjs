// npm test: a temporary database, migrate, seed twice, every command, the rules, the import and the
// rendered pages. Set TEST_DATABASE_URL to run the same checks against a new, empty Postgres.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getDb, REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {seed} from './seed.mjs';
import {run, commands, resolve, date, timestamp, human} from './risk.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'risk-test-'));
process.env.DATA_DIR = path.join(dir, 'db'); process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || ''; process.env.OUTPUT_DIR = dir;
let db; const visited = new Set();
const call = async (c, o = {}, p = []) => { visited.add(c); return run(db, [c, ...p, ...Object.entries(o).map(([k, v]) => v === true ? `--${k}` : `--${k}=${v}`)]); };
const fails = (c, o, re, p = []) => assert.rejects(() => call(c, o, p), re);
const shell = (file, argv = []) => { const r = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts', file), ...argv], {cwd: REPO_ROOT, env: process.env, encoding: 'utf8'}); assert.equal(r.status, 0, r.stderr || r.stdout); return r.stdout; };
const find = (rows, ref, key = 'reference') => rows.find(r => r[key] === ref);
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const actor = 'Test operator';

try {
  db = await getDb();
  if (db.mode === 'postgres') assert.equal((await db.query("select tablename from pg_tables where schemaname='public'")).length, 0, 'TEST_DATABASE_URL must be a new, empty, disposable database');
  assert.equal((await migrate(db)).ran.length, 1); assert.equal((await migrate(db)).ran.length, 0);
  await seed(db); await seed(db);

  // ---- reads on the demo data
  assert.equal((await call('help')).length, Object.keys(commands).length);
  const risks = await call('risks'); assert.equal(risks.length, 7);
  assert.equal(find(risks, 'R-002').rating, 'Extreme'); assert.equal(find(risks, 'R-001').residual, 12);
  assert.equal((await call('risks', {category: 'technology'})).length, 2);
  assert.equal((await call('risks', {owner: 'marcus', rating: 'medium'})).length, 1);
  const heat = await call('heat-map'); assert.equal(heat[2]['5 Severe'], 'R-002'); assert.equal(heat[0].likelihood, '5 Almost certain');
  assert.equal((await call('heat-map', {inherent: true}))[0]['5 Severe'], 'R-002');
  assert.deepEqual((await call('appetite')).map(r => r.reference), ['R-002', 'R-001', 'R-004']);
  const moved = await call('movement'); assert.equal(moved.length, 1); assert.equal(moved[0].direction, 'up');
  assert.equal((await call('movement', {since: day(-365)})).length, 2);
  assert.deepEqual((await call('stale-ratings')).map(r => r.reference).sort(), ['R-002', 'R-003']);
  assert.equal((await call('control-gaps')).length, 4);
  const reviews = await call('reviews-due'); assert.equal(find(reviews, 'R-001').days_left, -10); assert(find(reviews, 'R-005'));
  assert.equal(find(await call('controls-due'), 'C-2').days_left, -30);
  assert.equal((await call('actions-due')).length, 4); assert.equal((await call('actions-due', {days: '7'})).length, 3);
  const inc = await call('incidents'); assert.equal(inc.length, 4); assert(find(inc, 'INC-1').apra_24h_due); assert.equal(find(inc, 'INC-3').ndb_assess_by, day(-3));
  const obl = await call('obligations-due'); assert(find(obl, 'OB-1')); assert(find(obl, 'OB-3'), 'a recorded breach always shows'); assert(find(obl, 'OB-4'));
  const res = await call('resilience'); assert.equal(res.critical_operations.length, 3); assert.equal(find(res.critical_operations, 'OP-1').breaches_12m, 1);
  const rules = await call('compliance'); const has = (ref, rule) => rules.some(r => r.reference === ref && r.rule === rule);
  for (const [ref, rule] of [['INC-1', 'CPS230-42'], ['INC-1', 'CPS230-33'], ['INC-3', 'AU-NDB-26WH'], ['INC-3', 'CPS230-32'], ['INC-4', 'NZ-PA-114'], ['OP-1', 'CPS230-43'], ['OP-2', 'CPS230-38'], ['OP-2', 'CPS230-45'], ['SP-1', 'CPS230-59'], ['SP-2', 'CPS230-59'], ['R-002/C-3', 'CPS230-30'], ['R-002', 'POLICY-APPETITE'], ['R-005', 'POLICY-OWNER'], ['R-001', 'POLICY-REVIEW'], ['OB-3', 'POLICY-BREACH'], ['OB-1', 'POLICY-ATTEST']]) assert(has(ref, rule), `${ref} ${rule}`);
  assert.equal(rules.find(r => r.reference === 'INC-1' && r.rule === 'CPS230-42').severity, 1, '24-hour clock is past');
  assert.equal(rules.find(r => r.reference === 'INC-1' && r.rule === 'CPS230-33').severity, 2, '72-hour clock still running');
  assert(rules.find(r => r.reference === 'SP-1').finding.startsWith('Breached'));
  assert(!has('R-001', 'POLICY-APPETITE'), 'over appetite with a treatment under way is not a finding');
  assert(!rules.some(r => r.rule === 'ASX-7.2'), 'ASX rule only for listed entities');
  const att = await call('attention'); assert(find(att, 'R-005')); assert.equal(att[0].severity, 1);
  const work = await call('owner-workload'); assert.equal(find(work, 'Marcus', 'owner').total_overdue, 4);
  assert((await call('activity')).length >= 7); assert.equal((await call('activity', {record: 'r-003'})).length, 1);
  const weekly = await call('weekly-review'); assert.deepEqual(Object.keys(weekly), ['compliance', 'incidents', 'actions-due', 'reviews-due', 'controls-due', 'appetite']);
  const one = await call('risk', {risk: 'core banking'}); assert.equal(one.risk.reference, 'R-001'); assert.equal(one.controls.length, 2); assert.equal(one.reviews.length, 2);
  assert.equal((await resolve(db, 'risks', 'a0000000-0000-0000-0000-000000000001')).reference, 'R-001');
  await assert.rejects(() => resolve(db, 'risks', 'a'), /Ambiguous[\s\S]*R-001[\s\S]*R-002/);
  await assert.rejects(() => resolve(db, 'risks', "%' or true --"), /No matching/);
  assert.equal((await call('settings'))[0].name, 'Tasman Community Mutual');

  // ---- input checks
  assert.throws(() => date('2026-02-30'), /real ISO/); assert.throws(() => timestamp('yesterday', '--aware'), /YYYY-MM-DD/);
  assert.equal(timestamp('2026-10-01 09:30', 'x'), '2026-10-01T09:30:00.000Z');
  await fails('risks', {typo: true}, /Unknown option/); await fails('risks', {json: 'false'}, /bare flag/);
  await fails('reviews-due', {days: '-1'}, /whole number/); await fails('nope', {}, /Unknown command/);

  // ---- writes and the rules they enforce
  await call('add-category', {name: 'Strategic', appetite: '10', 'review-every': '180', actor});
  await fails('add-risk', {reference: 'R-100', title: 'X', category: 'Nope', owner: 'Lee', likelihood: '2', consequence: '2', actor}, /Unknown category[\s\S]*Strategic/);
  await fails('add-risk', {reference: 'R-100', title: 'X', category: 'Strategic', owner: 'Lee', likelihood: '2', consequence: '2', 'residual-likelihood': '3', actor}, /cannot be higher/);
  await fails('add-risk', {reference: 'R-100', title: 'X', category: 'Strategic', owner: 'Lee', likelihood: 'often', consequence: '2', actor}, /likelihood label/);
  const added = await call('add-risk', {reference: 'R-100', title: 'Member growth <script>alert(1)</script>', category: 'strategic', owner: 'Lee', likelihood: 'Likely', consequence: 'Major', 'residual-likelihood': '3', 'residual-consequence': 'moderate', actor});
  assert.equal(added.status, 'open'); assert.equal(added.next_review_on, day(180)); assert.equal(added.residual_likelihood * added.residual_consequence, 9);
  await fails('add-risk', {reference: 'r-100', title: 'Dup', category: 'Strategic', owner: 'Lee', likelihood: '1', consequence: '1', actor}, /unique|duplicate/i);
  await call('review-risk', {risk: 'R-100', 'residual-likelihood': '4', 'residual-consequence': '3', note: 'Two competitors launched', actor});
  assert.equal(find(await call('movement'), 'R-100').after, 12);
  assert((await call('compliance')).some(r => r.reference === 'R-100' && r.rule === 'POLICY-APPETITE'));
  await fails('review-risk', {risk: 'R-100', 'residual-likelihood': '5', 'residual-consequence': '5', note: 'x', actor}, /cannot be higher/);
  await fails('review-risk', {risk: 'R-100', 'residual-likelihood': '1', 'residual-consequence': '1', note: 'x', date: day(3), actor}, /future/);
  await call('add-action', {risk: 'R-100', reference: 'A-200', title: 'Launch the referral offer', owner: 'Lee', due: day(30), actor});
  assert(!(await call('compliance')).some(r => r.reference === 'R-100' && r.rule === 'POLICY-APPETITE'), 'treatment clears the appetite finding');
  await fails('add-action', {reference: 'A-201', title: 'x', owner: 'Lee', due: day(1), actor}, /exactly one/);
  await fails('update-risk', {risk: 'R-100', status: 'closed', actor}, /open actions[\s\S]*A-200/);
  await fails('complete-action', {action: 'A-200', actor}, /--evidence is required/);
  await call('complete-action', {action: 'A-200', evidence: 'board://offer-launched', actor});
  await fails('complete-action', {action: 'A-200', evidence: 'again', actor}, /already complete/);
  await call('update-risk', {risk: 'R-005', owner: 'Tom', 'next-review': day(30), actor});
  assert(!(await call('compliance')).some(r => r.reference === 'R-005' && r.rule === 'POLICY-OWNER'));
  await call('add-control', {risk: 'R-100', reference: 'C-1', title: 'Monthly growth report', owner: 'Lee', kind: 'detective', 'test-every': '90', actor});
  await fails('test-control', {risk: 'R-100', control: 'C-1', result: 'great', evidence: 'x', actor}, /result must be/);
  await call('test-control', {risk: 'R-100', control: 'C-1', result: 'effective', evidence: 'audit://growth', actor});
  assert.equal((await resolve(db, 'controls', 'C-1', added.id)).effectiveness, 'effective');
  await call('test-control', {risk: 'R-002', control: 'C-3', result: 'effective', evidence: 'audit://restore', actor});
  assert(!(await call('compliance')).some(r => r.reference === 'R-002/C-3'));
  await call('update-risk', {risk: 'R-100', status: 'closed', actor});
  assert(!find(await call('risks'), 'R-100'));

  // incidents and their clocks
  const aware = new Date(Date.now() - 2 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
  await fails('log-incident', {reference: 'INC-9', title: 'x', aware: day(2), actor}, /future/);
  await fails('log-incident', {reference: 'INC-9', title: 'x', aware, 'outside-tolerance': 'true', actor}, /needs --operation/);
  await call('log-incident', {reference: 'INC-9', title: 'Online banking slow', aware, severity: 'major', operation: 'OP-2', risk: 'R-001', 'material-impact': 'yes', 'outside-tolerance': 'true', actor});
  const after = await call('compliance');
  assert(after.some(r => r.reference === 'INC-9' && r.rule === 'CPS230-42' && r.severity === 2), '24-hour clock running');
  await fails('close-incident', {incident: 'INC-9', 'root-cause': 'Load', actor}, /APRA was notified/);
  await fails('update-incident', {incident: 'INC-9', 'regulator-notified': '2000-01-01', actor}, /predate/);
  await fails('update-incident', {incident: 'INC-9', 'privacy-assessed': day(0), actor}, /not recorded as a privacy breach/);
  await call('update-incident', {incident: 'INC-9', 'regulator-notified': new Date().toISOString().slice(0, 16).replace('T', ' '), actor});
  assert(!(await call('compliance')).some(r => r.reference === 'INC-9'));
  await call('add-action', {incident: 'INC-9', reference: 'A-300', title: 'Add capacity', owner: 'Tom', due: day(5), actor});
  await fails('close-incident', {incident: 'INC-9', 'root-cause': 'Load', actor}, /open actions[\s\S]*A-300/);
  await call('complete-action', {action: 'A-300', evidence: 'change://capacity', actor});
  await call('close-incident', {incident: 'INC-9', 'root-cause': 'Database connection limit', actor});
  await fails('close-incident', {incident: 'INC-9', 'root-cause': 'x', actor}, /already closed/);
  await call('log-incident', {reference: 'INC-10', title: 'Lost laptop <script>bad</script>', aware: day(-1), privacy: 'AU', actor});
  assert((await call('compliance')).some(r => r.reference === 'INC-10' && r.rule === 'AU-NDB-26WH' && r.severity === 2));
  await call('update-incident', {incident: 'INC-10', 'privacy-assessed': day(0), 'privacy-notifiable': 'false', actor});
  assert(!(await call('compliance')).some(r => r.reference === 'INC-10' && r.rule.startsWith('AU-NDB')));
  await call('update-incident', {incident: 'INC-3', 'privacy-assessed': day(0), 'privacy-notifiable': 'true', risk: 'R-002', actor});
  assert((await call('compliance')).some(r => r.reference === 'INC-3' && r.rule === 'AU-NDB-26WK'));
  await call('update-incident', {incident: 'INC-3', 'privacy-notified': day(0), actor});
  assert(!(await call('compliance')).some(r => r.reference === 'INC-3'));

  // obligations, resilience and settings
  await call('add-obligation', {reference: 'OB-9', title: 'Annual risk framework review', source: 'Board charter', owner: 'Hana', 'attest-every': '365', actor});
  assert(find(await call('obligations-due'), 'OB-9'));
  await fails('attest', {obligation: 'OB-9', outcome: 'fine', evidence: 'x', actor}, /outcome must be/);
  await call('attest', {obligation: 'OB-9', outcome: 'compliant', evidence: 'board://minutes', actor});
  assert(!find(await call('obligations-due'), 'OB-9'));
  await call('add-operation', {reference: 'OP-9', name: 'Loan settlement', owner: 'Tom', 'max-outage-hours': '12', 'max-data-loss-hours': '1', actor});
  await fails('add-operation', {reference: 'OP-10', name: 'x', owner: 'Tom', 'max-outage-hours': 'soon', actor}, /number of hours/);
  assert((await call('compliance')).some(r => r.reference === 'OP-9' && r.rule === 'CPS230-43'));
  await call('exercise', {operation: 'OP-9', kind: 'exercise', actor}); await call('exercise', {operation: 'loan settlement', kind: 'bcp-review', actor});
  assert(!(await call('compliance')).some(r => r.reference === 'OP-9'));
  await call('add-provider', {reference: 'SP-9', name: 'Settle Co', service: 'Settlement messaging', owner: 'Tom', material: 'true', operation: 'OP-9', 'agreement-changed': day(-1), actor});
  assert((await call('compliance')).some(r => r.reference === 'SP-9' && r.rule === 'CPS230-59' && r.severity === 2));
  await call('update-provider', {provider: 'SP-9', 'regulator-notified': day(0), reviewed: day(0), actor});
  assert(!(await call('compliance')).some(r => r.reference === 'SP-9'));
  await call('settings', {'asx-listed': 'true', actor}); assert((await call('compliance')).some(r => r.rule === 'ASX-7.2') === false, 'reviewed 300 days ago is inside the year');
  await call('settings', {'framework-reviewed': day(-400), actor}); assert((await call('compliance')).some(r => r.rule === 'ASX-7.2'));
  await call('settings', {'apra-regulated': 'false', 'asx-listed': 'false', actor}); assert(!(await call('compliance')).some(r => r.rule.startsWith('CPS230')), 'CPS 230 only for APRA-regulated entities');
  await call('settings', {'apra-regulated': 'true', actor});
  await call('log', {record: 'sp-1', note: 'Provider asked for the variation letter', actor});
  assert((await call('activity', {record: 'SP-1'})).some(r => r.note === 'Provider asked for the variation letter'));
  await fails('log', {record: 'NOPE-1', note: 'x', actor}, /No record/);
  await fails('add-control', {risk: 'R-001', reference: 'C-5', title: 'x', owner: 'Lee'}, /--actor is required/);

  // drafts
  const report = await call('risk-report'); const text = fs.readFileSync(report.file, 'utf8');
  assert(text.includes('DRAFT for the committee chair')); assert(text.includes('Tasman Community Mutual')); assert(text.includes('R-002'));
  for (const to of ['apra', 'opc', 'oaic']) { const d = await call('draft-notification', {incident: 'INC-1', to}); assert(fs.readFileSync(d.file, 'utf8').includes('Nothing has been sent')); }
  await fails('draft-notification', {incident: 'INC-1', to: 'email'}, /--to must be/);

  // ---- import from a Camms risk register export
  const imp = {file: path.join(REPO_ROOT, 'fixtures/camms.csv'), actor: 'Migration operator'};
  assert.equal((await call('import', {...imp, 'dry-run': true}, ['camms'])).added, 2);
  await assert.rejects(() => resolve(db, 'risks', 'SR-12'), /No matching/, 'dry run leaves nothing behind');
  const first = await call('import', imp, ['camms']); assert.equal(first.added, 2); assert.equal(first.residual_defaulted_to_inherent, 1);
  assert.equal((await call('import', imp, ['camms'])).unchanged, 2);
  const sr12 = await resolve(db, 'risks', 'SR-12'); assert.equal(sr12.status, 'draft'); assert.equal(sr12.inherent_likelihood * sr12.inherent_consequence, 16); assert.equal(sr12.next_review_on, '2026-11-15'); assert.equal(sr12.source_row['Risk Status'], 'Active');
  assert((await call('compliance')).some(r => r.reference === 'SR-12' && r.rule === 'POLICY-IMPORT'));
  const changed = path.join(dir, 'changed.csv'); fs.writeFileSync(changed, fs.readFileSync(imp.file, 'utf8').replace('Tom Lee', 'Someone Else'));
  await fails('import', {...imp, file: changed}, /changed since the last import/, ['camms']);
  const atomic = path.join(dir, 'atomic.csv'); fs.writeFileSync(atomic, 'Risk ID,Risk Title,Risk Category,Inherent Likelihood,Inherent Consequence\nN-1,Fine,Operational,2,2\nN-2,Bad,Unknown category,2,2\n');
  await fails('import', {...imp, file: atomic}, /Unknown category/, ['camms']); await assert.rejects(() => resolve(db, 'risks', 'CAMMS-N-1'), /No matching/);
  const mapped = path.join(dir, 'mapped.csv'), map = path.join(dir, 'map.json');
  fs.writeFileSync(mapped, 'Key,Name,Group,L,C\nM-1,Mapped risk,Financial,3 - Possible,4 - Major\n'); fs.writeFileSync(map, JSON.stringify({source_id: 'Key', title: 'Name', category: 'Group', inherent_likelihood: 'L', inherent_consequence: 'C'}));
  assert.equal((await call('import', {...imp, file: mapped, map}, ['camms'])).added, 1); assert.equal((await resolve(db, 'risks', 'CAMMS-M-1')).inherent_consequence, 4);
  fs.writeFileSync(map, JSON.stringify({source_id: 'Missing'})); await fails('import', {...imp, file: mapped, map}, /Mapped column missing/, ['camms']);
  await fails('import', imp, /Supported import: camms/, ['riskonnect']);

  const exp = await call('export'); const backup = JSON.parse(fs.readFileSync(exp.file, 'utf8'));
  assert.equal(backup.records.risks.length, 11); assert.equal(Object.keys(backup.records).length, 16); assert(backup.records.activity.length > 40);
  assert(human(await call('risks')).includes('SR-12'));
  assert.equal(Object.keys(commands).filter(c => !visited.has(c)).length, 0, `Uncovered commands: ${Object.keys(commands).filter(c => !visited.has(c))}`);
  await db.close(); db = null;

  // ---- the CLI as a person runs it, and the rendered pages
  assert.equal(JSON.parse(shell('risk.mjs', ['risks', '--json'])).length, 10);
  const amb = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts/risk.mjs'), 'risk', '--risk=a', '--json'], {cwd: REPO_ROOT, env: process.env, encoding: 'utf8'});
  assert.equal(amb.status, 1); assert.match(amb.stderr, /R-001[\s\S]*R-002/); assert.equal(amb.stdout, '');
  shell('view.mjs'); shell('docs.mjs');
  const week = fs.readFileSync(path.join(dir, 'views', 'week.html'), 'utf8'); assert(week.includes('Risk week')); assert(week.includes('CPS230'));
  assert.equal(fs.readdirSync(path.join(dir, 'views')).length, 3);
  const profiles = fs.readdirSync(path.join(dir, 'docs-out', 'risk-profile')); assert(profiles.length >= 9);
  const reports = fs.readdirSync(path.join(dir, 'docs-out', 'incident-report')); assert(reports.length >= 7);
  const laptop = fs.readFileSync(path.join(dir, 'docs-out', 'incident-report', reports.find(f => f.startsWith('inc-10-'))), 'utf8');
  assert(laptop.includes('&lt;script&gt;bad&lt;/script&gt;')); assert(!laptop.includes('<script>bad'));
  const closed = profiles.find(f => f.startsWith('r-100-')); assert(!closed, 'closed risks get no profile');
  console.log(`PASS: ${Object.keys(commands).length} CLI commands; CPS 230, privacy and house rules; incident clocks; import rollback, repeats and mapping; drafts, exports and rendered pages (${process.env.TEST_DATABASE_URL ? 'Postgres' : 'PGlite'}, ${process.platform}).`);
} finally { if (db) await db.close(); fs.rmSync(dir, {recursive: true, force: true}); }

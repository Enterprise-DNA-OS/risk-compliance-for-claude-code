// The Protecht demo, checked. Loads the insurer into a temporary database, asks each question in
// docs/protecht-demo.md through the same CLI the slash commands drive, and asserts the answer.
//   node scripts/demo-check.mjs             part of npm test
//   node scripts/demo-check.mjs --capture   also writes docs/demo/answers.md and docs/demo/board-report.html
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {getDb, REPO_ROOT} from './lib/db.mjs';
import {loadInsurer, INSURER} from './demo-insurer.mjs';
import {run, human} from './risk.mjs';

const capture = process.argv.includes('--capture');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'risk-demo-'));
Object.assign(process.env, {DATA_DIR: path.join(dir, 'db'), DATABASE_URL: '', OUTPUT_DIR: dir, BRAND_FILE: 'demo/insurer/brand.json'});
const refs = rows => rows.map(r => r.reference);
const out = [];
let db;
// One demo question: what the operator says, the command Claude runs, and the CLI output it answers from.
async function ask(n, question, argv, check) {
  const result = await run(db, argv);
  await check(result);
  const local = text => text.split(dir + path.sep).join('').split(REPO_ROOT + path.sep).join('');
  out.push(`## ${n}. "${question}"\n\nClaude runs \`npm run risk -- ${local(argv.map(a => (/\s/.test(a) ? `"${a}"` : a)).join(' '))}\`\n\n\`\`\`text\n${local(human(result))}\n\`\`\`\n`);
  return result;
}

try {
  db = await getDb();
  const n = await loadInsurer(db);
  assert.deepEqual([n.risks, n.controls, n.obligations, n.incidents, n.key_risk_indicators], [40, 60, 30, 15, 10], 'the demo dataset is the size the brief asked for');
  assert.deepEqual(await loadInsurer(db), n, 'loading twice changes nothing');
  assert.equal((await run(db, ['settings']))[0].name, INSURER);
  assert.equal((await run(db, ['compliance'])).filter(f => f.rule === 'CPS230-38' && /minimum service level/.test(f.finding)).map(f => f.reference).join(), 'OP-5', 'CPS 230 para 38(c)');

  // 1. Log an incident. 08:15 Sydney time three hours ago, said back in UTC before recording.
  const sydney = new Date(Date.now() - 3 * 3600e3 + 11 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
  const awareUtc = new Date(Date.parse(`${sydney.replace(' ', 'T')}:00+11:00`));
  await ask(1, `The claims payment run to Norvale failed today, about 900 payments did not go out. We knew at ${sydney.slice(11)} Sydney time. Daniel says the impact is material.`,
    ['log-incident', '--reference=INC-116', '--title=Claims payment run failed, 900 payments not sent', `--aware=${sydney}+11:00`, '--severity=major', '--owner=Daniel Okafor',
      '--risk=R-18', '--operation=OP-3', '--material-impact=true', '--description=The daily claim payment file was rejected by Norvale Payments. About 900 claim payments were not made.', '--actor=Anita Raman'],
    i => { assert.equal(i.reference, 'INC-116'); assert.equal(new Date(i.aware_at).getTime(), awareUtc.getTime()); assert.equal(i.material_impact, true); });
  await ask('1b', 'What clocks did that start?', ['incidents'], rows => {
    const i = rows.find(r => r.reference === 'INC-116');
    assert.equal(i.apra_72h_due, new Date(awareUtc.getTime() + 72 * 3600e3).toISOString().slice(0, 16).replace('T', ' '), 'CPS 230 para 33: APRA within 72 hours');
    assert.equal(rows.find(r => r.reference === 'INC-111').apra_24h_due !== null, true, 'the hosting outage 24 hour clock is still running');
  });

  // 2. Overdue control tests.
  await ask(2, 'Which control tests are overdue?', ['controls-due', '--days=0'], rows => {
    assert.deepEqual(refs(rows.filter(r => r.last_tested_on)), ['C-13', 'C-08', 'C-48', 'C-21', 'C-14', 'C-03', 'C-33', 'C-53'], 'eight overdue, most overdue first');
    assert.deepEqual(refs(rows.filter(r => !r.last_tested_on)).sort(), ['C-06', 'C-22', 'C-26', 'C-40'], 'four never tested');
    assert.equal(rows[0].days_left, -35);
  });

  // 3. Indicators breached this month.
  await ask(3, 'Which indicators breached this month?', ['indicator-breaches'], rows => {
    assert.deepEqual(refs(rows.filter(r => r.status === 'red')), ['KRI-01', 'KRI-03', 'KRI-04']);
    assert.deepEqual(refs(rows.filter(r => r.status === 'amber')), ['KRI-02', 'KRI-08', 'KRI-10']);
    assert(rows.every(r => r.measured_on.slice(0, 7) === new Date().toISOString().slice(0, 7)));
  });

  // 4. CPS 230 gaps.
  await ask(4, 'Where are our CPS 230 gaps?', ['cps230-gaps'], g => {
    assert.deepEqual(refs(g.operations.filter(o => o.gaps !== 'none')), ['OP-2', 'OP-3', 'OP-4', 'OP-5']);
    assert.match(g.operations.find(o => o.reference === 'OP-2').gaps, /exercise over a year old; disruption outside tolerance not yet notified to APRA/);
    assert.deepEqual(refs(g.providers.filter(p => p.gaps !== 'none')), ['SP-01', 'SP-02', 'SP-03', 'SP-06']);
    assert.deepEqual(g.findings.filter(f => f.severity === 1).map(f => `${f.reference} ${f.rule}`), ['OP-2 CPS230-43', 'OP-4 CPS230-43', 'SP-03 CPS230-59']);
    assert(g.findings.some(f => f.rule === 'CPS230-30' && f.finding === '4 never tested, 8 overdue: see controls-due'));
  });

  // 5. The quarterly board risk report.
  const board = await ask(5, 'Write the quarterly board risk report.', ['board-report'], r => {
    assert.equal(r.open_risks, 40); assert.equal(r.over_appetite, 9); assert.equal(r.red_indicators, 3); assert.equal(r.incidents, 14);
    const html = fs.readFileSync(r.file, 'utf8');
    for (const s of ['Tallowood General Insurance Ltd', 'data:image/svg+xml;base64,', 'For the board to decide', 'R-05 Exposure concentrated in flood-prone postcodes', 'R-13 Core systems', 'R-26 Renewal pricing', 'KRI-04', 'SP-03', 'INC-116']) assert(html.includes(s), s);
    assert(!/undefined|NaN|\[object/.test(html));
  });

  // 6. The switching story: a Protecht export comes across.
  const fx = f => path.join(REPO_ROOT, 'fixtures', f);
  await ask(6, 'Our marine and travel book is still in Protecht. Here is the risk register export: try it first.', ['import', 'protecht-risks', `--file=${fx('protecht-risks.csv')}`, '--actor=Anita Raman', '--dry-run'],
    r => assert.deepEqual([r.added, r.residual_defaulted_to_inherent, r.dry_run], [6, 1, true]));
  await ask('6b', 'Looks right. Import it.', ['import', 'protecht-risks', `--file=${fx('protecht-risks.csv')}`, '--actor=Anita Raman'],
    r => assert.equal(r.added, 6));
  await ask('6c', 'Now the incident register. The times in it are Sydney winter time.', ['import', 'protecht-incidents', `--file=${fx('protecht-incidents.csv')}`, '--offset=+10:00', '--actor=Anita Raman'],
    r => assert.deepEqual([r.added, r.open, r.closed, r.linked_to_a_risk], [5, 2, 3, 5]));
  await ask('6d', 'What still needs a person after the import?', ['compliance'], rows => {
    assert.deepEqual(rows.filter(f => f.rule === 'POLICY-IMPORT').map(f => f.reference).sort(), ['RSK-1001', 'RSK-1002', 'RSK-1003', 'RSK-1004', 'RSK-1005', 'RSK-1006']);
  });
  out[out.length - 1] = out[out.length - 1].replace(/```text\n[\s\S]*```/, m => { const lines = m.split('\n'); return [...lines.slice(0, 3), ...lines.filter(l => /POLICY-IMPORT/.test(l)), '  ... (the other findings are the same as before the import)', '```'].join('\n'); });
  assert.equal((await run(db, ['risk', '--risk=RSK-1003'])).incidents[0].reference, 'INC-2041', 'imported incidents land on their imported risk');

  if (capture) {
    const docs = path.join(REPO_ROOT, 'docs', 'demo'); fs.mkdirSync(docs, {recursive: true});
    fs.copyFileSync(board.file, path.join(docs, 'board-report.html'));
    fs.writeFileSync(path.join(docs, 'answers.md'), `# The Protecht demo, answered\n\nCaptured ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by \`node scripts/demo-check.mjs --capture\` against a fresh load of the demo insurer (\`npm run demo:insurer\`). Every answer below is asserted by \`npm test\`. Dates move with the day you run it; the shape of the answer does not.\n\nIn a session Claude reads this output and answers in plain language. The output is what the answer is built from.\n\n${out.join('\n')}`);
    console.log('captured: docs/demo/answers.md, docs/demo/board-report.html');
  }
  console.log(`PASS: Protecht demo, ${out.length} answers checked against ${INSURER}.`);
} finally { if (db) await db.close(); fs.rmSync(dir, {recursive: true, force: true}); }

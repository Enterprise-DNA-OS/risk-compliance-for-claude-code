#!/usr/bin/env node
// npm run demo:insurer: the Protecht ERM demo. Loads Tallowood General Insurance Ltd, a fictional
// Australian general insurer, into its own embedded database (./.data/insurer, or DATA_DIR).
// It never writes to DATABASE_URL, so a real register cannot be mixed with demo data.
// Safe to run twice. Then: DATA_DIR=.data/insurer BRAND_FILE=demo/insurer/brand.json claude
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb, REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';

export const INSURER = 'Tallowood General Insurance Ltd';

export async function loadInsurer(db) {
  await migrate(db);
  const org = (await db.query('select name from organisation'))[0];
  if (org && org.name !== INSURER) throw Error(`This database belongs to ${org.name}. The insurer demo needs its own: set DATA_DIR to a new folder.`);
  await db.exec('begin');
  try { await db.exec(fs.readFileSync(path.join(REPO_ROOT, 'demo/insurer/seed.sql'), 'utf8')); await db.exec('commit'); } catch (e) { await db.exec('rollback'); throw e; }
  const count = async t => (await db.query(`select count(*)::int n from ${t}`))[0].n;
  const out = {};
  for (const t of ['risks', 'controls', 'obligations', 'incidents', 'key_risk_indicators', 'kri_readings', 'critical_operations', 'service_providers', 'actions', 'audit_findings']) out[t] = await count(t);
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.env.DATABASE_URL = '';
  process.env.DATA_DIR ||= './.data/insurer';
  const db = await getDb();
  try {
    const n = await loadInsurer(db);
    console.log(`${INSURER} is ready in ${path.relative(REPO_ROOT, db.dir) || db.dir}`);
    console.log(Object.entries(n).map(([k, v]) => `  ${k.replace(/_/g, ' ')}: ${v}`).join('\n'));
    console.log(`\nOpen it in Claude Code with:\n  DATA_DIR=${process.env.DATA_DIR} BRAND_FILE=demo/insurer/brand.json claude\nThen follow docs/protecht-demo.md.`);
  } catch (e) { console.error(e.message); process.exitCode = 1; } finally { await db.close(); }
}

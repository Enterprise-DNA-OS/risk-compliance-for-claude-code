// The quarterly board risk report as one HTML page, in the operator's brand (brand.json or BRAND_FILE).
// risk.mjs gathers the rows; this file only lays them out. Print it to PDF from the browser for the board pack.
import { esc, page, loadBrand } from './render.mjs';

// Status colours are reserved for state (rating bands, indicator status) and always ship with a label.
const STATUS = { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' };
const ROLES = ['good', 'warning', 'serious', 'critical'];
const roleOf = (rank, n) => ROLES[Math.round(((rank - 1) * (ROLES.length - 1)) / Math.max(1, n - 1))];
const KRI = { red: { role: 'critical', icon: '◆', label: 'Red' }, amber: { role: 'warning', icon: '▲', label: 'Amber' }, green: { role: 'good', icon: '✓', label: 'Green' }, 'no reading': { role: null, icon: '–', label: 'No reading' } };

const fmtDate = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');
const fmtNum = (v) => (v === null || v === undefined ? '' : Number(v).toLocaleString('en-AU', { maximumFractionDigits: 2 }));
const withUnit = (v, unit) => (v === null || v === undefined ? '' : unit === '%' ? `${fmtNum(v)}%` : `${fmtNum(v)}${unit ? ` ${unit}` : ''}`);

function rows(list, cols, empty = 'Nothing to report.') {
  if (!list.length) return `<p class="empty">${esc(empty)}</p>`;
  const head = cols.map((c) => `<th${c.num ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('');
  const body = list.map((r) => `<tr>${cols.map((c) => `<td${c.num ? ' class="num"' : ''}>${c.html ? c.html(r) : esc(c.fmt ? c.fmt(r[c.key], r) : r[c.key] ?? '')}</td>`).join('')}</tr>`).join('');
  return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

const pill = (role, icon, label) => `<span class="pill"${role ? ` style="--s:${STATUS[role]}"` : ''}><i aria-hidden="true">${icon}</i>${esc(label)}</span>`;
const kriPill = (status) => { const k = KRI[status] || KRI['no reading']; return pill(k.role, k.icon, k.label); };

function bandFor(score, bands) {
  const b = bands.find((x) => score >= x.min_score && score <= x.max_score);
  return b ? { ...b, role: roleOf(b.rank, bands.length) } : null;
}
const ratingPill = (score, bands) => { const b = bandFor(score, bands); return b ? `${pill(b.role, '■', b.rating)} <span class="score">${score}</span>` : esc(score); };

function heatMap(d) {
  const n = d.bands.length;
  const lk = [...d.likelihood].sort((a, b) => b.level - a.level), cs = [...d.consequence].sort((a, b) => a.level - b.level);
  let cells = '';
  for (const l of lk) {
    cells += `<div class="hm-axis hm-row">${esc(l.level)} ${esc(l.label)}</div>`;
    for (const c of cs) {
      const hit = d.cells.find((x) => x.l === l.level && x.c === c.level);
      const b = bandFor(l.level * c.level, d.bands);
      const tip = `${l.label} x ${c.label}: score ${l.level * c.level}, ${b ? b.rating : ''}${hit ? `. ${hit.refs}` : '. No open risks'}`;
      cells += `<div class="hm-cell${hit ? '' : ' hm-empty'}" style="--s:${STATUS[b?.role || 'good']}" title="${esc(tip)}">
        ${hit ? `<b>${hit.n}</b>${hit.n <= 3 ? `<small>${hit.refs.split(' ').map((r) => `<span>${esc(r)}</span>`).join(' ')}</small>` : '<small>risks</small>'}` : ''}<span class="hm-band">${esc(b?.rating || '')}</span></div>`;
    }
  }
  cells += `<div></div>${cs.map((c) => `<div class="hm-axis hm-col">${esc(c.level)} ${esc(c.label)}</div>`).join('')}`;
  const legend = d.bands.map((b) => `<span class="lg"><i style="--s:${STATUS[roleOf(b.rank, n)]}"></i>${esc(b.rating)} (${b.min_score} to ${b.max_score})</span>`).join('');
  return `<div class="hm-wrap"><div class="hm-ytitle">Likelihood</div><div class="hm">${cells}</div></div>
    <div class="hm-xtitle">Consequence</div><div class="legend">${legend}</div>`;
}

function spark(history, k) {
  const vals = history.map((h) => Number(h.value));
  if (vals.length < 2) return '';
  const w = 104, h = 30, pad = 4;
  const lo = Math.min(...vals, k.amber, k.red), hi = Math.max(...vals, k.amber, k.red);
  const x = (i) => pad + (i * (w - pad * 2)) / (vals.length - 1);
  const y = (v) => (hi === lo ? h / 2 : h - pad - ((v - lo) * (h - pad * 2)) / (hi - lo));
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = vals.length - 1, role = (KRI[k.status] || {}).role;
  const tip = history.map((r) => `${fmtDate(r.measured_on)}: ${withUnit(r.value, k.unit)}`).join('\n');
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(`Last ${vals.length} readings`)}"><title>${esc(tip)}</title>
    <line x1="${pad}" x2="${w - pad}" y1="${y(k.red).toFixed(1)}" y2="${y(k.red).toFixed(1)}" class="thr"/>
    <polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(last).toFixed(1)}" cy="${y(vals[last]).toFixed(1)}" r="4" fill="${role ? STATUS[role] : '#888'}" stroke="#fff" stroke-width="2"/></svg>`;
}

const tile = (value, label, sub, role = null) => `<div class="tile"${role ? ` style="--s:${STATUS[role]}"` : ''}><div class="tv">${esc(value)}</div><div class="tl">${esc(label)}</div>${sub ? `<div class="ts">${esc(sub)}</div>` : ''}</div>`;

export function boardReportHtml(d, brand = loadBrand()) {
  if (brand.business_name === 'Your Business' && d.org.name) brand = { ...brand, business_name: d.org.name };
  const over = d.register.filter((r) => r.over_appetite);
  const untreated = over.filter((r) => !r.open_actions);
  const red = d.indicators.filter((k) => k.status === 'red'), amber = d.indicators.filter((k) => k.status === 'amber');
  const now = d.findings.filter((f) => f.severity === 1);
  const cpsNow = d.cps.findings.filter((f) => f.severity === 1);
  const openInc = d.incidents.filter((i) => i.status === 'open');

  const decisions = [
    ...untreated.map((r) => `Accept, treat or escalate <b>${esc(r.reference)} ${esc(r.title)}</b>: residual ${r.residual_score} against an appetite of ${r.appetite_score}, with no treatment under way (owner ${esc(r.owner || 'unassigned')}).`),
    ...red.map((k) => `Note red indicator <b>${esc(k.reference)} ${esc(k.name)}</b> at ${esc(withUnit(k.last_value, k.unit))} (red from ${esc(withUnit(k.red, k.unit))}), and ask ${esc(k.owner)} for the response.`),
    ...cpsNow.map((f) => `CPS 230: <b>${esc(f.reference)}</b> ${esc(f.finding)} (${esc(f.rule)}).`),
  ];

  const kpis = `<div class="tiles">
    ${tile(d.register.length, 'Open risks', `${d.register.filter((r) => ['High', 'Extreme'].includes(r.rating)).length} rated High or Extreme`)}
    ${tile(over.length, 'Over appetite', `${untreated.length} with no treatment`, over.length ? 'serious' : null)}
    ${tile(red.length, 'Red indicators', `${amber.length} amber, ${d.indicators.length} tracked`, red.length ? 'critical' : null)}
    ${tile(d.incidents.length, 'Incidents in the quarter', `${openInc.length} still open`)}
    ${tile(d.overdue.length, 'Overdue actions', `${d.controls.overdue + d.controls.never} control tests overdue or never run`, d.overdue.length ? 'warning' : null)}
    ${tile(now.length, 'Rule findings needing action', `${d.findings.length} findings in total`, now.length ? 'critical' : null)}
  </div>`;

  const intro = `<div class="draft">DRAFT for the Board Risk Committee. Prepared ${esc(fmtDate(d.until))} from the risk register, covering ${esc(fmtDate(d.since))} to ${esc(fmtDate(d.until))}. The Chief Risk Officer checks every figure before it goes in the board pack.</div>${kpis}`;

  const sections = [
    { title: 'For the board to decide', html: decisions.length ? `<ol class="decide">${decisions.map((x) => `<li>${x}</li>`).join('')}</ol>` : '<p class="empty">No decisions are needed this quarter.</p>' },
    { title: 'Risk profile (residual)', note: 'Open risks by residual likelihood and consequence. Hover a cell for the risks in it.', html: `<div class="split"><div>${heatMap(d)}</div><div><h3>Top ten risks</h3>${rows(d.register.slice(0, 10), [
      { label: 'Risk', html: (r) => `<b>${esc(r.reference)}</b> ${esc(r.title)}` }, { label: 'Owner', key: 'owner' }, { label: 'Residual', html: (r) => ratingPill(r.residual_score, d.bands) },
    ])}</div></div>` },
    { title: 'Risks over appetite', note: 'Residual score above the appetite the board set for the category.', html: rows(over, [
      { label: 'Risk', html: (r) => `<b>${esc(r.reference)}</b> ${esc(r.title)}` }, { label: 'Category', key: 'category' }, { label: 'Owner', key: 'owner' },
      { label: 'Residual', key: 'residual_score', num: true }, { label: 'Appetite', key: 'appetite_score', num: true },
      { label: 'Treatment', html: (r) => (r.open_actions ? `${r.open_actions} action${r.open_actions > 1 ? 's' : ''} open` : '<b class="flag">None</b>') },
    ]) },
    { title: 'Key risk indicators', note: 'Latest reading against the amber and red thresholds. The line shows recent readings; the dashed line is the red threshold.', html: rows(d.indicators, [
      { label: 'Indicator', html: (k) => `<b>${esc(k.reference)}</b> ${esc(k.name)}` }, { label: 'Owner', key: 'owner' }, { label: 'Status', html: (k) => kriPill(k.status) },
      { label: 'Latest', num: true, html: (k) => esc(withUnit(k.last_value, k.unit)) }, { label: 'Amber / red', num: true, html: (k) => esc(`${withUnit(k.amber, k.unit)} / ${withUnit(k.red, k.unit)}`) },
      { label: 'Recent readings', html: (k) => spark(d.history[k.reference] || [], k) }, { label: 'Trend', key: 'trend' },
    ]) },
    { title: 'Rating movement in the quarter', html: rows(d.moves, [
      { label: 'Risk', html: (r) => `<b>${esc(r.reference)}</b> ${esc(r.title)}` }, { label: 'Reviewed', fmt: fmtDate, key: 'reviewed_on' },
      { label: 'Before', key: 'before', num: true }, { label: 'After', key: 'after', num: true }, { label: 'Direction', html: (r) => (r.direction === 'up' ? '<b class="flag">▲ Up</b>' : '▼ Down') },
    ], 'No residual ratings changed in the quarter.') },
    { title: 'Incidents in the quarter', html: rows(d.incidents, [
      { label: 'Incident', html: (r) => `<b>${esc(r.reference)}</b> ${esc(r.title)}` }, { label: 'Severity', key: 'severity' }, { label: 'Aware', key: 'aware_on', fmt: fmtDate },
      { label: 'Risk', key: 'risk' }, { label: 'APRA notice', html: (r) => esc(r.apra) }, { label: 'Status', key: 'status' },
    ], 'No incidents were recorded in the quarter.') },
    { title: 'Operational resilience (CPS 230)', note: d.cps.summary, html: `${rows(d.cps.operations, [
      { label: 'Critical operation', html: (r) => `<b>${esc(r.reference)}</b> ${esc(r.name)}` }, { label: 'Max outage', html: (r) => esc(r.max_outage_hours === null ? 'not set' : `${fmtNum(r.max_outage_hours)} h`), num: true },
      { label: 'Last exercise', key: 'last_exercise_on', fmt: (v) => fmtDate(v) || 'never' }, { label: 'Outside tolerance (12m)', key: 'outside_tolerance_12m', num: true },
      { label: 'Gaps', html: (r) => (r.gaps === 'none' ? '<span class="ok">✓ None</span>' : esc(r.gaps)) },
    ])}<h3>Material service providers with a gap</h3>${rows(d.cps.providers.filter((p) => p.gaps !== 'none'), [
      { label: 'Provider', html: (r) => `<b>${esc(r.reference)}</b> ${esc(r.name)}` }, { label: 'Service', key: 'service' }, { label: 'Operation', key: 'operation' }, { label: 'Gap', key: 'gaps' },
    ], 'Every material provider is mapped, reviewed and notified.')}` },
    { title: 'Control assurance', note: `${d.controls.total} active controls: ${d.controls.effective} effective, ${d.controls.overdue} tests overdue, ${d.controls.never} never tested.`, html: rows(d.controls.weak, [
      { label: 'Control', html: (r) => `<b>${esc(r.control)}</b> ${esc(r.control_title)}` }, { label: 'Risk', key: 'risk' }, { label: 'Owner', key: 'owner' }, { label: 'Result', key: 'effectiveness' }, { label: 'Last tested', key: 'last_tested_on', fmt: fmtDate },
    ], 'No control was found ineffective.') },
    { title: 'Compliance obligations', note: 'Obligations whose last attestation was a breach or partial, or whose attestation is overdue.', html: rows(d.obligations, [
      { label: 'Obligation', html: (r) => `<b>${esc(r.reference)}</b> ${esc(r.title)}` }, { label: 'Source', key: 'source' }, { label: 'Owner', key: 'owner' },
      { label: 'Last attested', key: 'last_attested_on', fmt: (v) => fmtDate(v) || 'never' }, { label: 'Outcome', html: (r) => (r.last_outcome === 'breach' ? '<b class="flag">Breach</b>' : esc(r.last_outcome || (r.days_left < 0 ? 'overdue' : ''))) },
    ]) },
    { title: 'Internal audit findings', html: rows(d.audit, [
      { label: 'Finding', html: (r) => `<b>${esc(r.reference)}</b> ${esc(r.title)}` }, { label: 'Audit', key: 'audit' }, { label: 'Rating', key: 'rating' }, { label: 'Owner', key: 'owner' },
      { label: 'Due', html: (r) => `${esc(fmtDate(r.due_on))}${r.days_left < 0 ? ` <b class="flag">${-r.days_left} days late</b>` : ''}` },
    ], 'No internal audit findings are open.') },
  ];
  return page({ title: 'Quarterly board risk report', subtitle: `${fmtDate(d.since)} to ${fmtDate(d.until)}`, sections, brand, css: CSS, intro });
}

const CSS = `
.draft{background:#fff8e6;border:1px solid #f1d58a;border-radius:10px;padding:10px 14px;margin:0 0 16px;font-size:14px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:0 0 18px}
.tile{background:var(--paper);border-radius:14px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.06);border-top:4px solid var(--s,#d9d9e3)}
.tv{font:700 34px/1.1 Poppins,system-ui,sans-serif}.tl{font-weight:600;margin-top:2px}.ts{color:#666;font-size:13px}
h3{font:600 14px/1.3 Poppins,system-ui,sans-serif;margin:0 0 8px;color:var(--ink)}section h3:not(:first-child){margin-top:16px}
.decide{margin:0;padding-left:22px}.decide li{margin:0 0 6px}
.split{display:grid;grid-template-columns:minmax(300px,1fr) minmax(320px,1.2fr);gap:24px;align-items:start}
.hm-wrap{display:flex;align-items:center;gap:6px}.hm-ytitle{writing-mode:vertical-rl;transform:rotate(180deg);color:#666;font-size:12px;font-weight:600}
.hm{display:grid;grid-template-columns:86px repeat(5,minmax(44px,1fr));gap:2px;flex:1}
.hm-cell{position:relative;min-height:62px;border-radius:4px;background:color-mix(in srgb,var(--s) 30%,#fff);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:15px 3px 5px;text-align:center}
.hm-empty{background:color-mix(in srgb,var(--s) 12%,#fff)}.hm-cell b{font-size:18px;line-height:1}.hm-cell small{font-size:10px;color:#333;line-height:1.3;margin-top:3px}.hm-cell small span{white-space:nowrap}
.hm-band{position:absolute;top:2px;right:4px;font-size:8px;color:#555;text-transform:uppercase;letter-spacing:.04em}
.hm-axis{font-size:11px;color:#555;display:flex;align-items:center;line-height:1.25}.hm-row{justify-content:flex-end;padding-right:6px;text-align:right}.hm-col{justify-content:center;align-items:flex-start;text-align:center;padding-top:4px;font-size:10px;hyphens:auto}
.hm-xtitle{text-align:center;color:#666;font-size:12px;font-weight:600;margin:2px 0 8px 98px}
.legend{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:#444;margin-left:20px}.lg{display:inline-flex;align-items:center;gap:5px}.lg i{width:12px;height:12px;border-radius:3px;background:color-mix(in srgb,var(--s) 30%,#fff);border:2px solid var(--s)}
.pill{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-size:13px;font-weight:600}.pill i{font-style:normal;color:var(--s,#888);font-size:12px}
.score{color:#666;font-size:12px}.num{text-align:right}.flag{color:#b02a2a}.ok{color:#0a7d0a;font-weight:600}
.spark{color:#3d3d4e;display:block}.spark .thr{stroke:${STATUS.critical};stroke-width:1;stroke-dasharray:3 3;opacity:.7}
@media(max-width:820px){.split{grid-template-columns:1fr}}
@media print{.tiles{grid-template-columns:repeat(3,1fr)}.draft{break-inside:avoid}}
`;

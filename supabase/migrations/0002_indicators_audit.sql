-- Key risk indicators with amber and red thresholds, the internal audit findings register,
-- source tracking for imported incidents, and the rules that read them.
-- Plain Postgres. Runs the same on PGlite. No extensions.

-- A key risk indicator: one measure, the risk it watches, and where amber and red start.
-- direction 'higher' means a higher value is worse (e.g. overdue patches); 'lower' means a lower value is worse (e.g. availability).
create table key_risk_indicators (
  id uuid primary key default gen_random_uuid(),
  reference text not null check (btrim(reference) <> ''),
  name text not null check (btrim(name) <> ''),
  description text not null default '',
  owner text not null check (btrim(owner) <> ''),
  risk_id uuid references risks(id),
  critical_operation_id uuid references critical_operations(id),
  unit text not null default '',
  direction text not null default 'higher' check (direction in ('higher','lower')),
  amber_threshold numeric not null,
  red_threshold numeric not null,
  measure_every_days int not null default 30 check (measure_every_days between 1 and 366),
  status text not null default 'active' check (status in ('active','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((direction = 'higher' and red_threshold >= amber_threshold) or (direction = 'lower' and red_threshold <= amber_threshold))
);
create unique index key_risk_indicators_reference_ci_idx on key_risk_indicators(lower(reference));

create table kri_readings (
  id uuid primary key default gen_random_uuid(),
  kri_id uuid not null references key_risk_indicators(id),
  measured_on date not null,
  value numeric not null,
  recorded_by text not null check (btrim(recorded_by) <> ''),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (kri_id, measured_on)
);

-- Internal audit findings: what the auditor found, how serious, who fixes it, by when.
create table audit_findings (
  id uuid primary key default gen_random_uuid(),
  reference text not null check (btrim(reference) <> ''),
  audit text not null check (btrim(audit) <> ''),
  title text not null check (btrim(title) <> ''),
  description text not null default '',
  rating text not null check (rating in ('low','medium','high')),
  owner text not null check (btrim(owner) <> ''),
  risk_id uuid references risks(id),
  control_id uuid references controls(id),
  raised_on date not null,
  due_on date not null,
  status text not null default 'open' check (status in ('open','closed')),
  closed_on date,
  evidence text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_on >= raised_on),
  check ((status = 'open' and closed_on is null) or (status = 'closed' and closed_on is not null and btrim(evidence) <> ''))
);
create unique index audit_findings_reference_ci_idx on audit_findings(lower(reference));

-- Imported incidents keep their source row, the same way imported risks do.
alter table incidents add column source_id text unique, add column source_row jsonb, add column source_hash text;

create trigger key_risk_indicators_touch before update on key_risk_indicators for each row execute function touch_updated_at();
create trigger audit_findings_touch before update on audit_findings for each row execute function touch_updated_at();

-- Green, amber or red for one reading.
create function kri_rag(direction text, amber numeric, red numeric, v numeric) returns text language sql immutable as $$
  select case when v is null then 'no reading'
    when (direction = 'higher' and v >= red) or (direction = 'lower' and v <= red) then 'red'
    when (direction = 'higher' and v >= amber) or (direction = 'lower' and v <= amber) then 'amber'
    else 'green' end
$$;

create view kri_status with (security_invoker=true) as
select k.id, k.reference, k.name, k.owner, r.reference as risk, o.reference as critical_operation, k.unit, k.direction,
  k.amber_threshold::float8 as amber, k.red_threshold::float8 as red,
  last.measured_on as last_measured_on, last.value::float8 as last_value, prev.value::float8 as previous_value,
  kri_rag(k.direction, k.amber_threshold, k.red_threshold, last.value) as status,
  case when prev.value is null or last.value = prev.value then 'steady'
       when (k.direction = 'higher') = (last.value > prev.value) then 'worse' else 'better' end as trend,
  coalesce(last.measured_on + k.measure_every_days, current_date) as next_due_on,
  coalesce(last.measured_on + k.measure_every_days, current_date) - current_date as days_left
from key_risk_indicators k
left join risks r on r.id = k.risk_id
left join critical_operations o on o.id = k.critical_operation_id
left join lateral (select x.measured_on, x.value from kri_readings x where x.kri_id = k.id order by x.measured_on desc limit 1) last on true
left join lateral (select x.value from kri_readings x where x.kri_id = k.id order by x.measured_on desc offset 1 limit 1) prev on true
where k.status = 'active';

create view audit_queue with (security_invoker=true) as
select f.id, f.reference, f.audit, f.title, f.rating, f.owner, r.reference as risk, c.reference as control,
  f.raised_on, f.due_on, f.due_on - current_date as days_left
from audit_findings f left join risks r on r.id = f.risk_id left join controls c on c.id = f.control_id
where f.status = 'open';

-- The rules, as in 0001 with four changes:
--   CPS230-38 also checks the minimum service level (para 38(c)).
--   POLICY-ATTEST now also flags an obligation that has never been attested.
--   New house policies: POLICY-KRI-RED, POLICY-KRI-LATE, POLICY-AUDIT, POLICY-PROVIDER-REVIEW.
create or replace view compliance_findings with (security_invoker=true) as
-- CPS 230 para 33: material operational risk incident, APRA within 72 hours.
select 'incident'::text as kind, i.reference, 'CPS230-33'::text as rule,
  case when now() > i.aware_at + interval '72 hours' then 'Breached: APRA notice was due ' || to_char(i.aware_at + interval '72 hours', 'YYYY-MM-DD HH24:MI') || ' UTC'
       else 'Notify APRA by ' || to_char(i.aware_at + interval '72 hours', 'YYYY-MM-DD HH24:MI') || ' UTC' end as finding,
  case when now() > i.aware_at + interval '72 hours' then 1 else 2 end as severity
from incidents i, organisation g where g.apra_regulated and i.material_impact and i.regulator_notified_at is null
-- CPS 230 para 42: disruption to a critical operation outside tolerance, APRA within 24 hours.
union all select 'incident', i.reference, 'CPS230-42',
  case when now() > i.aware_at + interval '24 hours' then 'Breached: disruption outside tolerance, APRA notice was due ' || to_char(i.aware_at + interval '24 hours', 'YYYY-MM-DD HH24:MI') || ' UTC'
       else 'Notify APRA by ' || to_char(i.aware_at + interval '24 hours', 'YYYY-MM-DD HH24:MI') || ' UTC' end,
  case when now() > i.aware_at + interval '24 hours' then 1 else 2 end
from incidents i, organisation g where g.apra_regulated and i.outside_tolerance and i.regulator_notified_at is null
-- CPS 230 para 43: an annual business continuity exercise for every critical operation.
union all select 'operation', o.reference, 'CPS230-43',
  case when o.last_exercise_on is null then 'No business continuity exercise recorded' else 'Last exercise ' || o.last_exercise_on || ', over a year ago' end, 1
from critical_operations o, organisation g where g.apra_regulated and (o.last_exercise_on is null or o.last_exercise_on < current_date - 365)
-- CPS 230 para 38: tolerance levels set for each critical operation: outage, data loss and minimum service level.
union all select 'operation', o.reference, 'CPS230-38',
  'Set the missing tolerance levels: ' || concat_ws(', ',
    case when o.max_outage_hours is null then 'maximum outage' end,
    case when o.max_data_loss_hours is null then 'maximum data loss' end,
    case when btrim(o.min_service_level) = '' then 'minimum service level' end), 2
from critical_operations o, organisation g where g.apra_regulated and (o.max_outage_hours is null or o.max_data_loss_hours is null or btrim(o.min_service_level) = '')
-- CPS 230 para 45: the BCP updated, as necessary, on an annual basis.
union all select 'operation', o.reference, 'CPS230-45',
  case when o.bcp_reviewed_on is null then 'No BCP review recorded' else 'BCP last reviewed ' || o.bcp_reviewed_on end, 2
from critical_operations o, organisation g where g.apra_regulated and (o.bcp_reviewed_on is null or o.bcp_reviewed_on < current_date - 365)
-- CPS 230 para 59: notify APRA within 20 business days of entering or materially changing a critical-operation agreement.
union all select 'provider', p.reference, 'CPS230-59',
  case when current_date > add_business_days(p.agreement_changed_on, 20) then 'Breached: APRA notice was due ' || add_business_days(p.agreement_changed_on, 20)
       else 'Notify APRA by ' || add_business_days(p.agreement_changed_on, 20) end,
  case when current_date > add_business_days(p.agreement_changed_on, 20) then 1 else 2 end
from service_providers p, organisation g
where g.apra_regulated and p.status = 'active' and p.critical_operation_id is not null and p.agreement_changed_on is not null
  and (p.regulator_notified_on is null or p.regulator_notified_on < p.agreement_changed_on)
-- CPS 230 para 30: controls tested at a frequency matched to the risk.
union all select 'control', c.risk || '/' || c.reference, 'CPS230-30',
  case when c.last_tested_on is null then 'Never tested' else 'Test overdue by ' || (-c.days_left) || ' days' end, 2
from control_queue c, organisation g where g.apra_regulated and (c.days_left < 0 or c.last_tested_on is null)
-- CPS 230 para 32: incidents taken into account in the risk profile.
union all select 'incident', i.reference, 'CPS230-32', 'Link the incident to the risk it touches', 3
from incidents i, organisation g where g.apra_regulated and i.kind = 'incident' and i.risk_id is null
-- NZ Privacy Act 2020 s114: notify the Privacy Commissioner as soon as practicable.
union all select 'incident', i.reference, 'NZ-PA-114',
  case when i.privacy_notifiable is null then 'Assess whether the breach is notifiable (aware ' || (current_date - i.aware_at::date) || ' days)'
       else 'Notifiable: notify the Privacy Commissioner as soon as practicable, the OPC expects 72 hours (aware ' || (current_date - i.aware_at::date) || ' days)' end, 1
from incidents i where i.privacy_breach and i.privacy_jurisdiction = 'NZ' and (i.privacy_notifiable is null or (i.privacy_notifiable and i.privacy_notified_on is null))
-- AU Privacy Act 1988 s26WH: assess a suspected eligible data breach within 30 days.
union all select 'incident', i.reference, 'AU-NDB-26WH',
  case when current_date > i.aware_at::date + 30 then 'Breached: assessment was due ' || (i.aware_at::date + 30) else 'Complete the assessment by ' || (i.aware_at::date + 30) end,
  case when current_date > i.aware_at::date + 30 then 1 else 2 end
from incidents i where i.privacy_breach and i.privacy_jurisdiction = 'AU' and i.privacy_assessed_on is null
-- AU Privacy Act 1988 s26WK and s26WL: an eligible data breach is notified as soon as practicable.
union all select 'incident', i.reference, 'AU-NDB-26WK', 'Eligible data breach: notify the OAIC and affected individuals as soon as practicable', 1
from incidents i where i.privacy_breach and i.privacy_jurisdiction = 'AU' and i.privacy_notifiable and i.privacy_notified_on is null
-- ASX Corporate Governance Principles, Recommendation 7.2: review the framework at least annually.
union all select 'framework', g.name, 'ASX-7.2',
  case when g.framework_reviewed_on is null then 'No framework review recorded' else 'Framework last reviewed ' || g.framework_reviewed_on end, 2
from organisation g where g.asx_listed and (g.framework_reviewed_on is null or g.framework_reviewed_on < current_date - 365)
-- House policies. Local rules, not law: change them with /customise.
union all select 'risk', r.reference, 'POLICY-APPETITE', 'Residual ' || r.residual_score || ' is over appetite ' || r.appetite_score || ' with no open treatment action', 1
from risk_register r where r.status = 'open' and r.over_appetite and r.open_actions = 0
union all select 'risk', r.reference, 'POLICY-REVIEW',
  case when r.next_review_on is null then 'No review date set' else 'Review overdue by ' || (-r.review_days_left) || ' days' end, 2
from risk_register r where r.status = 'open' and (r.next_review_on is null or r.review_days_left < 0)
union all select 'risk', r.reference, 'POLICY-OWNER', 'Assign a risk owner', 2
from risk_register r where btrim(r.owner) = ''
union all select 'risk', r.reference, 'POLICY-IMPORT', 'Imported draft: confirm the ratings and owner, then open it', 3
from risk_register r where r.status = 'draft'
union all select 'obligation', o.reference, 'POLICY-ATTEST',
  case when o.last_attested_on is null then 'Never attested' else 'Attestation overdue by ' || (-o.days_left) || ' days' end, 2
from obligation_queue o where o.days_left < 0 or o.last_attested_on is null
union all select 'obligation', o.reference, 'POLICY-BREACH', 'Last attestation recorded a breach: log the incident and treatment', 1
from obligation_queue o where o.last_outcome = 'breach'
union all select 'indicator', k.reference, 'POLICY-KRI-RED',
  'Red: ' || k.last_value || coalesce(' ' || nullif(k.unit, ''), '') || ' on ' || k.last_measured_on || ' against a red threshold of ' || k.red || '. Escalate to ' || k.owner, 1
from kri_status k where k.status = 'red'
union all select 'indicator', k.reference, 'POLICY-KRI-LATE',
  case when k.last_measured_on is null then 'No reading recorded' else 'Reading overdue by ' || (-k.days_left) || ' days' end, 2
from kri_status k where k.last_measured_on is null or k.days_left < 0
union all select 'audit', f.reference, 'POLICY-AUDIT',
  initcap(f.rating) || ' audit finding overdue by ' || (-f.days_left) || ' days, ' || f.owner, case when f.rating = 'high' then 1 else 2 end
from audit_queue f where f.days_left < 0
union all select 'provider', p.reference, 'POLICY-PROVIDER-REVIEW',
  case when p.last_reviewed_on is null then 'Material provider never reviewed' else 'Material provider last reviewed ' || p.last_reviewed_on || ', over a year ago' end, 2
from service_providers p where p.material and p.status = 'active' and (p.last_reviewed_on is null or p.last_reviewed_on < current_date - 365);

revoke all on kri_status, audit_queue, compliance_findings from public;

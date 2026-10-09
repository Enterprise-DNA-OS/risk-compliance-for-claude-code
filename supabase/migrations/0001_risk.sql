-- Risk and Compliance for Claude Code: the register, controls, treatments, incidents,
-- compliance obligations and operational resilience records (APRA CPS 230).
-- Plain Postgres. Runs the same on PGlite. No extensions.

create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- One row: who this is and which rule sets apply. /customise changes it.
create table organisation (
  id boolean primary key default true check (id),
  name text not null default 'Your Business',
  jurisdiction text not null default 'NZ' check (jurisdiction in ('NZ','AU','other')),
  apra_regulated boolean not null default false,
  asx_listed boolean not null default false,
  framework_reviewed_on date,
  updated_at timestamptz not null default now()
);

-- The risk matrix. Score = likelihood x consequence (1-25). Change the bands to match your framework.
create table rating_bands (
  rating text primary key check (btrim(rating) <> ''),
  min_score int not null check (min_score between 1 and 25),
  max_score int not null check (max_score between 1 and 25),
  rank int not null unique,
  check (max_score >= min_score)
);

create table likelihood_scale (level int primary key check (level between 1 and 5), label text not null unique);
create table consequence_scale (level int primary key check (level between 1 and 5), label text not null unique);

-- Appetite per category: the highest residual score the board accepts without a treatment plan.
create table risk_categories (
  name text primary key check (btrim(name) <> ''),
  appetite_score int not null check (appetite_score between 1 and 25),
  review_every_days int not null default 90 check (review_every_days between 7 and 730)
);

create table risks (
  id uuid primary key default gen_random_uuid(),
  reference text not null check (btrim(reference) <> ''),
  title text not null check (btrim(title) <> ''),
  description text not null default '',
  category text not null references risk_categories(name) on update cascade,
  owner text not null default '',
  status text not null default 'draft' check (status in ('draft','open','closed')),
  inherent_likelihood int not null check (inherent_likelihood between 1 and 5),
  inherent_consequence int not null check (inherent_consequence between 1 and 5),
  residual_likelihood int not null check (residual_likelihood between 1 and 5),
  residual_consequence int not null check (residual_consequence between 1 and 5),
  last_reviewed_on date,
  next_review_on date,
  source_id text unique,
  source_row jsonb,
  source_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (residual_likelihood * residual_consequence <= inherent_likelihood * inherent_consequence)
);
create unique index risks_reference_ci_idx on risks(lower(reference));
create index risks_review_idx on risks(next_review_on) where status <> 'closed';

-- Each reassessment, kept. The register shows the latest; the history shows the trend.
create table risk_reviews (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references risks(id),
  reviewer text not null check (btrim(reviewer) <> ''),
  reviewed_on date not null,
  residual_likelihood int not null check (residual_likelihood between 1 and 5),
  residual_consequence int not null check (residual_consequence between 1 and 5),
  note text not null check (btrim(note) <> ''),
  created_at timestamptz not null default now()
);

create table controls (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references risks(id),
  reference text not null check (btrim(reference) <> ''),
  title text not null check (btrim(title) <> ''),
  owner text not null check (btrim(owner) <> ''),
  kind text not null default 'preventive' check (kind in ('preventive','detective','corrective')),
  effectiveness text not null default 'not-tested' check (effectiveness in ('effective','partially-effective','ineffective','not-tested')),
  test_every_days int not null default 180 check (test_every_days between 7 and 1095),
  last_tested_on date,
  status text not null default 'active' check (status in ('active','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (risk_id, reference)
);
create unique index controls_reference_ci_idx on controls(risk_id, lower(reference));

create table control_tests (
  id uuid primary key default gen_random_uuid(),
  control_id uuid not null references controls(id),
  tested_on date not null,
  tester text not null check (btrim(tester) <> ''),
  result text not null check (result in ('effective','partially-effective','ineffective')),
  evidence text not null check (btrim(evidence) <> ''),
  note text not null default '',
  created_at timestamptz not null default now()
);

-- Treatment actions: what is being done to bring a risk back inside appetite.
create table actions (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid references risks(id),
  incident_id uuid,
  reference text not null check (btrim(reference) <> ''),
  title text not null check (btrim(title) <> ''),
  owner text not null check (btrim(owner) <> ''),
  due_on date not null,
  status text not null default 'open' check (status in ('open','done')),
  completed_on date,
  evidence text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'open' and completed_on is null) or (status = 'done' and completed_on is not null and btrim(evidence) <> ''))
);
create unique index actions_reference_ci_idx on actions(lower(reference));
create index actions_due_idx on actions(due_on) where status = 'open';

-- CPS 230 paragraphs 34-46: critical operations, their tolerance levels and BCP testing.
create table critical_operations (
  id uuid primary key default gen_random_uuid(),
  reference text not null check (btrim(reference) <> ''),
  name text not null check (btrim(name) <> ''),
  owner text not null default '',
  max_outage_hours numeric(8,2) check (max_outage_hours > 0),
  max_data_loss_hours numeric(8,2) check (max_data_loss_hours >= 0),
  min_service_level text not null default '',
  last_exercise_on date,
  bcp_reviewed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index critical_operations_reference_ci_idx on critical_operations(lower(reference));

-- CPS 230 paragraphs 47-60: material service providers.
create table service_providers (
  id uuid primary key default gen_random_uuid(),
  reference text not null check (btrim(reference) <> ''),
  name text not null check (btrim(name) <> ''),
  service text not null check (btrim(service) <> ''),
  owner text not null default '',
  material boolean not null default false,
  critical_operation_id uuid references critical_operations(id),
  agreement_changed_on date,
  regulator_notified_on date,
  last_reviewed_on date,
  status text not null default 'active' check (status in ('active','exited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index service_providers_reference_ci_idx on service_providers(lower(reference));

create table incidents (
  id uuid primary key default gen_random_uuid(),
  reference text not null check (btrim(reference) <> ''),
  title text not null check (btrim(title) <> ''),
  description text not null default '',
  kind text not null default 'incident' check (kind in ('incident','near-miss')),
  severity text not null default 'minor' check (severity in ('minor','moderate','major','severe')),
  owner text not null default '',
  occurred_at timestamptz,
  aware_at timestamptz not null,
  risk_id uuid references risks(id),
  critical_operation_id uuid references critical_operations(id),
  -- Regulator: the entity's own judgement that CPS 230 para 33 applies (material impact).
  material_impact boolean not null default false,
  -- CPS 230 para 42: a disruption to a critical operation outside tolerance.
  outside_tolerance boolean not null default false,
  regulator_notified_at timestamptz,
  -- Privacy: NZ Privacy Act 2020 s114 and the AU Notifiable Data Breaches scheme.
  privacy_breach boolean not null default false,
  privacy_jurisdiction text check (privacy_jurisdiction in ('NZ','AU')),
  privacy_assessed_on date,
  privacy_notifiable boolean,
  privacy_notified_on date,
  status text not null default 'open' check (status in ('open','closed')),
  closed_on date,
  root_cause text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (occurred_at is null or occurred_at <= aware_at),
  check ((status = 'open' and closed_on is null) or (status = 'closed' and closed_on is not null)),
  check (not privacy_breach or privacy_jurisdiction is not null)
);
create unique index incidents_reference_ci_idx on incidents(lower(reference));
alter table actions add constraint actions_incident_fk foreign key (incident_id) references incidents(id);

-- The compliance obligations register: each duty, its source and how often someone attests to it.
create table obligations (
  id uuid primary key default gen_random_uuid(),
  reference text not null check (btrim(reference) <> ''),
  title text not null check (btrim(title) <> ''),
  source text not null check (btrim(source) <> ''),
  owner text not null default '',
  attest_every_days int not null default 365 check (attest_every_days between 7 and 1095),
  status text not null default 'active' check (status in ('active','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index obligations_reference_ci_idx on obligations(lower(reference));

create table attestations (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references obligations(id),
  attested_on date not null,
  attested_by text not null check (btrim(attested_by) <> ''),
  outcome text not null check (outcome in ('compliant','partial','breach')),
  evidence text not null check (btrim(evidence) <> ''),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table activity (
  id bigint generated always as identity primary key,
  record_kind text not null,
  record_ref text not null,
  actor text not null check (btrim(actor) <> ''),
  action text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create trigger risks_touch before update on risks for each row execute function touch_updated_at();
create trigger controls_touch before update on controls for each row execute function touch_updated_at();
create trigger actions_touch before update on actions for each row execute function touch_updated_at();
create trigger incidents_touch before update on incidents for each row execute function touch_updated_at();
create trigger obligations_touch before update on obligations for each row execute function touch_updated_at();
create trigger critical_operations_touch before update on critical_operations for each row execute function touch_updated_at();
create trigger service_providers_touch before update on service_providers for each row execute function touch_updated_at();
create trigger organisation_touch before update on organisation for each row execute function touch_updated_at();

-- ------------------------------------------------------------------ views

create view control_queue with (security_invoker=true) as
select c.id, r.reference as risk, c.reference, c.title, c.owner, c.kind, c.effectiveness,
  c.last_tested_on, coalesce(c.last_tested_on + c.test_every_days, current_date) as next_test_on,
  coalesce(c.last_tested_on + c.test_every_days, current_date) - current_date as days_left
from controls c join risks r on r.id = c.risk_id
where c.status = 'active' and r.status <> 'closed';

create view action_queue with (security_invoker=true) as
select a.id, coalesce(r.reference, i.reference) as record, a.reference, a.title, a.owner, a.due_on,
  a.due_on - current_date as days_left
from actions a left join risks r on r.id = a.risk_id left join incidents i on i.id = a.incident_id
where a.status = 'open';

create view risk_register with (security_invoker=true) as
select r.id, r.reference, r.title, r.category, r.owner, r.status,
  r.inherent_likelihood * r.inherent_consequence as inherent_score,
  r.residual_likelihood * r.residual_consequence as residual_score,
  (select b.rating from rating_bands b where r.residual_likelihood * r.residual_consequence between b.min_score and b.max_score) as rating,
  k.appetite_score,
  r.residual_likelihood * r.residual_consequence > k.appetite_score as over_appetite,
  r.last_reviewed_on, r.next_review_on, r.next_review_on - current_date as review_days_left,
  (select count(*) from controls c where c.risk_id = r.id and c.status = 'active')::int as controls,
  (select count(*) from controls c where c.risk_id = r.id and c.status = 'active' and c.effectiveness in ('ineffective','not-tested'))::int as weak_controls,
  (select count(*) from controls c where c.risk_id = r.id and c.status = 'active' and (c.last_tested_on is null or c.last_tested_on + c.test_every_days < current_date))::int as tests_due,
  (select count(*) from actions a where a.risk_id = r.id and a.status = 'open')::int as open_actions,
  (select count(*) from actions a where a.risk_id = r.id and a.status = 'open' and a.due_on < current_date)::int as overdue_actions,
  (select count(*) from incidents i where i.risk_id = r.id and i.aware_at > now() - interval '365 days')::int as incidents_12m,
  (select max(x.created_at)::date from activity x where x.record_kind = 'risk' and x.record_ref = r.reference) as last_activity
from risks r join risk_categories k on k.name = r.category
where r.status <> 'closed';

-- Business days after a date, Monday to Friday. Public holidays are not known to the database:
-- add them with /customise if your deadline counting needs them.
create function add_business_days(start_on date, n int) returns date language sql immutable as $$
  select d::date from generate_series(start_on + 1, start_on + n * 2 + 14, interval '1 day') d
  where extract(isodow from d) < 6 order by d offset n - 1 limit 1
$$;

create view incident_queue with (security_invoker=true) as
select i.id, i.reference, i.title, i.kind, i.severity, i.owner, i.aware_at,
  (current_date - i.aware_at::date) as days_open,
  r.reference as risk, o.reference as critical_operation,
  case when i.material_impact and i.regulator_notified_at is null then i.aware_at + interval '72 hours' end as cps230_33_due_at,
  case when i.outside_tolerance and i.regulator_notified_at is null then i.aware_at + interval '24 hours' end as cps230_42_due_at,
  case when i.privacy_breach and i.privacy_jurisdiction = 'AU' and i.privacy_assessed_on is null then i.aware_at::date + 30 end as ndb_assess_by,
  i.privacy_breach, i.privacy_jurisdiction, i.privacy_notifiable, i.privacy_notified_on,
  (select count(*) from actions a where a.incident_id = i.id and a.status = 'open')::int as open_actions
from incidents i left join risks r on r.id = i.risk_id left join critical_operations o on o.id = i.critical_operation_id
where i.status = 'open';

create view obligation_queue with (security_invoker=true) as
select o.id, o.reference, o.title, o.source, o.owner, last.attested_on as last_attested_on, last.outcome as last_outcome,
  coalesce(last.attested_on + o.attest_every_days, current_date) as next_due_on,
  coalesce(last.attested_on + o.attest_every_days, current_date) - current_date as days_left
from obligations o
left join lateral (select a.attested_on, a.outcome from attestations a where a.obligation_id = o.id order by a.attested_on desc, a.created_at desc limit 1) last on true
where o.status = 'active';

create view compliance_findings with (security_invoker=true) as
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
-- CPS 230 para 38: tolerance levels set for each critical operation.
union all select 'operation', o.reference, 'CPS230-38', 'Set the maximum outage and data loss tolerance levels', 2
from critical_operations o, organisation g where g.apra_regulated and (o.max_outage_hours is null or o.max_data_loss_hours is null)
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
from obligation_queue o where o.days_left < 0
union all select 'obligation', o.reference, 'POLICY-BREACH', 'Last attestation recorded a breach: log the incident and treatment', 1
from obligation_queue o where o.last_outcome = 'breach';

revoke all on control_queue, action_queue, risk_register, incident_queue, obligation_queue, compliance_findings from public;

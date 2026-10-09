-- Demo data: Tasman Community Mutual, a fictional Australian mutual regulated by APRA.
-- Dates are relative to today so the overdue reviews, late tests and running notice clocks
-- always have something to say. Safe to run twice: every insert skips rows already there.

insert into organisation (id, name, jurisdiction, apra_regulated, asx_listed, framework_reviewed_on)
values (true, 'Tasman Community Mutual', 'AU', true, false, current_date - 300)
on conflict do nothing;

insert into rating_bands (rating, min_score, max_score, rank) values
('Low', 1, 4, 1), ('Medium', 5, 9, 2), ('High', 10, 14, 3), ('Extreme', 15, 25, 4)
on conflict do nothing;

insert into likelihood_scale (level, label) values
(1, 'Rare'), (2, 'Unlikely'), (3, 'Possible'), (4, 'Likely'), (5, 'Almost certain')
on conflict do nothing;
insert into consequence_scale (level, label) values
(1, 'Insignificant'), (2, 'Minor'), (3, 'Moderate'), (4, 'Major'), (5, 'Severe')
on conflict do nothing;

insert into risk_categories (name, appetite_score, review_every_days) values
('Technology', 8, 90), ('Third party', 8, 90), ('Compliance', 4, 90),
('People', 9, 180), ('Financial', 6, 90), ('Operational', 9, 90)
on conflict do nothing;

insert into risks (id, reference, title, description, category, owner, status,
  inherent_likelihood, inherent_consequence, residual_likelihood, residual_consequence, last_reviewed_on, next_review_on) values
('a0000000-0000-0000-0000-000000000001', 'R-001', 'Core banking outage', 'Members cannot see balances or move money because the core banking platform is down.', 'Technology', 'Priya', 'open', 4, 5, 3, 4, current_date - 100, current_date - 10),
('a0000000-0000-0000-0000-000000000002', 'R-002', 'Cyber intrusion and member data theft', 'An attacker gets into staff accounts or member systems and takes personal information.', 'Technology', 'Marcus', 'open', 5, 5, 3, 5, current_date - 70, current_date + 20),
('a0000000-0000-0000-0000-000000000003', 'R-003', 'Card processor failure', 'The card processing provider cannot authorise member card payments.', 'Third party', 'Priya', 'open', 3, 4, 2, 4, current_date - 45, current_date + 45),
('a0000000-0000-0000-0000-000000000004', 'R-004', 'Responsible lending breach', 'Loans approved without the required suitability and serviceability checks.', 'Compliance', 'Hana', 'open', 3, 4, 2, 3, current_date - 30, current_date + 60),
('a0000000-0000-0000-0000-000000000005', 'R-005', 'Loss of key lending staff', 'Two senior lenders hold most of the commercial lending knowledge.', 'People', '', 'open', 3, 3, 3, 2, null, null),
('a0000000-0000-0000-0000-000000000006', 'R-006', 'Liquidity shortfall', 'Withdrawals outrun liquid assets during a run of member withdrawals.', 'Financial', 'Tom', 'open', 2, 5, 1, 5, current_date - 30, current_date + 60),
('a0000000-0000-0000-0000-000000000007', 'R-007', 'Payment redirection fraud', 'A fraudster changes a supplier or member''s bank details and diverts a payment.', 'Operational', 'Marcus', 'open', 4, 4, 3, 3, current_date - 93, current_date - 3)
on conflict do nothing;

insert into risk_reviews (id, risk_id, reviewer, reviewed_on, residual_likelihood, residual_consequence, note) values
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Priya', current_date - 190, 2, 4, 'Secondary data centre commissioned.'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Priya', current_date - 100, 3, 4, 'Failover test ran over time; likelihood raised.'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Marcus', current_date - 160, 2, 5, 'MFA rollout complete.'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Marcus', current_date - 70, 3, 5, 'Phishing click rate up in the last test.'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', 'Hana', current_date - 30, 2, 3, 'Lending file review found two gaps.'),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000007', 'Marcus', current_date - 93, 3, 3, 'Call-back step added to the payments procedure.')
on conflict do nothing;

insert into controls (id, risk_id, reference, title, owner, kind, effectiveness, test_every_days, last_tested_on) values
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'C-1', 'Failover to the secondary data centre', 'Priya', 'corrective', 'effective', 180, current_date - 200),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'C-2', 'Platform monitoring and on-call alerts', 'Priya', 'detective', 'effective', 90, current_date - 30),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'C-1', 'Multi-factor sign-in on every staff account', 'Marcus', 'preventive', 'effective', 180, current_date - 60),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'C-2', 'Quarterly phishing simulation', 'Marcus', 'detective', 'partially-effective', 90, current_date - 120),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'C-3', 'Backup restore test', 'Marcus', 'corrective', 'not-tested', 180, null),
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'C-1', 'Annual provider assurance review', 'Priya', 'preventive', 'effective', 365, current_date - 300),
('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'C-1', 'Serviceability check in the loan workflow', 'Hana', 'preventive', 'partially-effective', 90, current_date - 40),
('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000006', 'C-1', 'Daily liquidity report to the CFO', 'Tom', 'detective', 'effective', 30, current_date - 10),
('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000007', 'C-1', 'Call-back before changing bank details', 'Marcus', 'preventive', 'ineffective', 90, current_date - 15)
on conflict do nothing;

insert into control_tests (id, control_id, tested_on, tester, result, evidence, note) values
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', current_date - 200, 'Internal audit', 'effective', 'audit://2026/failover-test', 'Failover completed in 3 hours 40 minutes.'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000009', current_date - 15, 'Internal audit', 'ineffective', 'audit://2026/payments-sample', 'Three of ten changes had no call-back recorded.')
on conflict do nothing;

insert into critical_operations (id, reference, name, owner, max_outage_hours, max_data_loss_hours, min_service_level, last_exercise_on, bcp_reviewed_on) values
('e0000000-0000-0000-0000-000000000001', 'OP-1', 'Member payments', 'Priya', 4, 0.5, 'Card and transfer payments authorised for all members', current_date - 400, current_date - 200),
('e0000000-0000-0000-0000-000000000002', 'OP-2', 'Deposits and withdrawals', 'Tom', 8, null, 'Branch and online withdrawals available', current_date - 100, null),
('e0000000-0000-0000-0000-000000000003', 'OP-3', 'Member enquiries', 'Hana', 24, 4, 'Phone line answered within 5 minutes', current_date - 50, current_date - 50)
on conflict do nothing;

insert into service_providers (id, reference, name, service, owner, material, critical_operation_id, agreement_changed_on, regulator_notified_on, last_reviewed_on) values
('f0000000-0000-0000-0000-000000000001', 'SP-1', 'Cardline Processing', 'Card authorisation and settlement', 'Priya', true, 'e0000000-0000-0000-0000-000000000001', current_date - 40, null, current_date - 300),
('f0000000-0000-0000-0000-000000000002', 'SP-2', 'Northgate Hosting', 'Core banking hosting', 'Tom', true, 'e0000000-0000-0000-0000-000000000002', current_date - 5, null, current_date - 90),
('f0000000-0000-0000-0000-000000000003', 'SP-3', 'Coastal Mail House', 'Printing and posting member statements', 'Hana', false, null, null, null, current_date - 400)
on conflict do nothing;

insert into incidents (id, reference, title, description, kind, severity, owner, occurred_at, aware_at, risk_id, critical_operation_id,
  material_impact, outside_tolerance, regulator_notified_at, privacy_breach, privacy_jurisdiction, privacy_assessed_on, privacy_notifiable, privacy_notified_on, status, closed_on, root_cause) values
('10000000-0000-0000-0000-000000000001', 'INC-1', 'Card payments down for six hours', 'Card authorisations failed from 07:10 to 13:15 after a provider certificate expired.', 'incident', 'major', 'Priya', now() - interval '31 hours', now() - interval '30 hours', 'a0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', true, true, null, false, null, null, null, null, 'open', null, ''),
('10000000-0000-0000-0000-000000000002', 'INC-2', 'Staff member entered password on a phishing page', 'Reported within ten minutes; password reset and sign-ins reviewed.', 'near-miss', 'minor', 'Marcus', now() - interval '10 days', now() - interval '10 days', 'a0000000-0000-0000-0000-000000000002', null, false, false, null, false, null, null, null, null, 'open', null, ''),
('10000000-0000-0000-0000-000000000003', 'INC-3', 'Member statements posted to old addresses', 'A batch of 140 statements went to addresses members had already changed.', 'incident', 'moderate', 'Hana', now() - interval '35 days', now() - interval '33 days', null, null, false, false, null, true, 'AU', null, null, null, 'open', null, ''),
('10000000-0000-0000-0000-000000000004', 'INC-4', 'NZ member list emailed to the wrong recipient', 'A spreadsheet of 60 New Zealand members'' contact details went to an outside address.', 'incident', 'moderate', 'Hana', now() - interval '4 days', now() - interval '4 days', 'a0000000-0000-0000-0000-000000000002', null, false, false, null, true, 'NZ', current_date - 3, true, null, 'open', null, ''),
('10000000-0000-0000-0000-000000000005', 'INC-5', 'Supplier invoice paid to a changed account', 'A supplier email asked for new bank details; one invoice was paid before the fraud was found.', 'incident', 'moderate', 'Marcus', now() - interval '200 days', now() - interval '198 days', 'a0000000-0000-0000-0000-000000000007', null, false, false, null, false, null, null, null, null, 'closed', current_date - 150, 'No call-back on a bank detail change.')
on conflict do nothing;

insert into actions (id, risk_id, incident_id, reference, title, owner, due_on, status, completed_on, evidence) values
('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', null, 'A-101', 'Rewrite the failover runbook after the slow test', 'Priya', current_date - 12, 'open', null, ''),
('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', null, 'A-102', 'Retrain lenders on the serviceability check', 'Hana', current_date + 14, 'open', null, ''),
('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000007', null, 'A-103', 'Make call-back a required step in the payments system', 'Marcus', current_date - 2, 'open', null, ''),
('20000000-0000-0000-0000-000000000004', null, '10000000-0000-0000-0000-000000000004', 'A-104', 'Ask the recipient to delete the spreadsheet and confirm in writing', 'Hana', current_date + 3, 'open', null, ''),
('20000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', null, 'A-105', 'Add a second standby liquidity facility', 'Tom', current_date - 40, 'done', current_date - 45, 'board://2026/liquidity-facility')
on conflict do nothing;

insert into obligations (id, reference, title, source, owner, attest_every_days) values
('30000000-0000-0000-0000-000000000001', 'OB-1', 'Notify APRA of material operational risk incidents within 72 hours', 'APRA CPS 230 para 33', 'Hana', 90),
('30000000-0000-0000-0000-000000000002', 'OB-2', 'Run an annual business continuity exercise for every critical operation', 'APRA CPS 230 para 43', 'Priya', 365),
('30000000-0000-0000-0000-000000000003', 'OB-3', 'Assess loans as not unsuitable before approval', 'National Consumer Credit Protection Act 2009 (Cth) Chapter 3', 'Hana', 90),
('30000000-0000-0000-0000-000000000004', 'OB-4', 'Report reportable situations to ASIC within 30 days', 'Corporations Act 2001 (Cth) s912DAA', 'Tom', 365),
('30000000-0000-0000-0000-000000000005', 'OB-5', 'Keep a clearly expressed, current privacy policy', 'Privacy Act 1988 (Cth) APP 1', 'Hana', 365)
on conflict do nothing;

insert into attestations (id, obligation_id, attested_on, attested_by, outcome, evidence, note) values
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', current_date - 100, 'Hana', 'compliant', 'committee://2026/q2-pack', ''),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', current_date - 200, 'Priya', 'compliant', 'bcp://2026/exercise-report', 'OP-1 exercise was deferred; OP-2 and OP-3 ran.'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', current_date - 30, 'Hana', 'breach', 'audit://2026/lending-file-review', 'Two files had no serviceability assessment on record.'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', current_date - 20, 'Hana', 'compliant', 'web://privacy-policy', '')
on conflict do nothing;

insert into activity (record_kind, record_ref, actor, action, note, created_at)
select v.k, v.r, v.a, v.act, v.n, now() - v.ago from (values
  ('risk', 'R-001', 'Priya', 'review-risk', 'Likelihood raised after the slow failover test', interval '100 days'),
  ('risk', 'R-002', 'Marcus', 'review-risk', 'Phishing click rate up', interval '70 days'),
  ('risk', 'R-003', 'Priya', 'note', 'Provider certificate renewal process requested', interval '1 day'),
  ('risk', 'R-004', 'Hana', 'review-risk', 'Lending file review found two gaps', interval '30 days'),
  ('risk', 'R-006', 'Tom', 'complete-action', 'A-105 standby facility signed', interval '45 days'),
  ('risk', 'R-007', 'Marcus', 'test-control', 'C-1 ineffective in the audit sample', interval '15 days'),
  ('incident', 'INC-1', 'Priya', 'log-incident', 'Card payments down for six hours', interval '30 hours')
) v(k, r, a, act, n, ago)
where not exists (select 1 from activity);

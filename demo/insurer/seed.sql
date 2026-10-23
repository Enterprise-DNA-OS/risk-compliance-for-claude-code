-- Demo data: Tallowood General Insurance Ltd, a fictional Australian general insurer regulated by APRA.
-- Every name here is made up: the insurer, its people and its providers. Used by the Protecht ERM demo
-- (docs/protecht-demo.md). Load it with `npm run demo:insurer`, which keeps it in its own database.
-- Dates are relative to today so overdue tests, breached indicators and running notice clocks always
-- have something to say. Safe to run twice: every insert skips rows already there.

insert into organisation (id, name, jurisdiction, apra_regulated, asx_listed, framework_reviewed_on)
values (true, 'Tallowood General Insurance Ltd', 'AU', true, false, current_date - 200)
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

-- Appetite: the highest residual score the board accepts in each category without a treatment plan.
insert into risk_categories (name, appetite_score, review_every_days) values
('Insurance', 9, 90), ('Claims', 8, 90), ('Technology and cyber', 8, 90), ('Third party', 8, 90), ('Regulatory', 4, 90),
('Conduct', 6, 90), ('Financial', 6, 90), ('People', 9, 180), ('Operational', 9, 90), ('Strategic', 12, 180)
on conflict do nothing;

-- ------------------------------------------------------------------ the register (40 risks)
insert into risks (reference, title, description, category, owner, status,
  inherent_likelihood, inherent_consequence, residual_likelihood, residual_consequence, last_reviewed_on, next_review_on)
select v.ref, v.title, v.descr, v.cat, v.owner, 'open', v.il, v.ic, v.rl, v.rc, current_date + v.lr, current_date + v.nr from (values
('R-01', 'Catastrophe losses exceed the reinsurance programme', 'A severe storm, flood or bushfire season produces losses above the catastrophe reinsurance limit.', 'Insurance', 'James Kovac', 4, 5, 3, 4, -40, 50),
('R-02', 'Underpricing of the home and motor portfolios', 'Premiums fall behind claims inflation in repair, building and parts costs.', 'Insurance', 'James Kovac', 4, 4, 3, 3, -60, 30),
('R-03', 'Claims reserves understated', 'Outstanding claims liabilities are set too low, so profit and capital are overstated.', 'Insurance', 'Ben Castellano', 3, 5, 2, 4, -30, 60),
('R-04', 'Reinsurer fails to pay a recovery', 'A reinsurer on the panel cannot or will not pay a large recovery after an event.', 'Insurance', 'Daniel Okafor', 2, 5, 1, 5, -80, 10),
('R-05', 'Exposure concentrated in flood-prone postcodes', 'New business growth is clustered in postcodes with high modelled flood loss.', 'Insurance', 'James Kovac', 4, 4, 3, 4, -102, -12),
('R-06', 'Claims leakage through over-payment', 'Claims are paid above entitlement through weak assessment, authority or supplier checks.', 'Claims', 'Megan O''Rourke', 4, 3, 2, 4, -20, 70),
('R-07', 'Organised claims fraud', 'Staged motor accidents and inflated contents claims, sometimes with repairer collusion.', 'Claims', 'Megan O''Rourke', 4, 4, 2, 4, -50, 40),
('R-08', 'Catastrophe surge overwhelms claims handling', 'After a major event, claim volumes exceed the capacity of staff and partner call centres.', 'Claims', 'Megan O''Rourke', 4, 4, 3, 4, -45, 45),
('R-09', 'Claims decisions miss General Insurance Code timeframes', 'Claims are not acknowledged, decided or updated within the Code of Practice timeframes.', 'Claims', 'Megan O''Rourke', 3, 4, 3, 3, -10, 80),
('R-10', 'Ransomware attack on policy and claims systems', 'An attacker encrypts or steals data from the policy administration and claims platforms.', 'Technology and cyber', 'Nadia Haddad', 4, 5, 3, 5, -95, -5),
('R-11', 'Policy administration system outage', 'Policies cannot be issued, renewed or changed because the policy system is down.', 'Technology and cyber', 'Liam Tran', 3, 4, 2, 4, -70, 20),
('R-12', 'Customer data exposed through the broker portal', 'Brokers'' portal accounts are used to reach customer personal and policy information.', 'Technology and cyber', 'Nadia Haddad', 3, 5, 2, 5, -30, 60),
('R-13', 'Core systems running past vendor support', 'Two core platforms are past end of support and no longer receive security patches.', 'Technology and cyber', 'Liam Tran', 4, 3, 3, 3, -110, -20),
('R-14', 'Claims platform cloud migration fails', 'The move of the claims platform to the cloud loses data or overruns its cut-over window.', 'Technology and cyber', 'Liam Tran', 3, 4, 2, 3, -40, 50),
('R-15', 'Outsourced claims call centre fails', 'The outsourced contact centre cannot take claim calls because of a system, staffing or site failure.', 'Third party', 'Sarah Whitfield', 3, 4, 2, 4, -70, 20),
('R-16', 'Loss of the cloud hosting provider', 'The hosting provider has a prolonged outage or exits the market.', 'Third party', 'Liam Tran', 2, 5, 2, 4, -60, 30),
('R-17', 'Builder and repairer capacity after a catastrophe', 'Panel builders and repairers cannot meet demand after a large event, so repairs stall.', 'Third party', 'Megan O''Rourke', 4, 3, 2, 4, -92, -2),
('R-18', 'Payment provider failure delays claim payments', 'The payments provider cannot process the daily claim payment file.', 'Third party', 'Daniel Okafor', 2, 4, 2, 3, -40, 50),
('R-19', 'APRA notices under CPS 230 missed', 'A material incident or provider change is not notified to APRA inside the required time.', 'Regulatory', 'Priyanka Desai', 3, 4, 1, 4, -20, 70),
('R-20', 'New products launched without a valid target market determination', 'Design and distribution obligations are not met for a new or changed retail product.', 'Regulatory', 'Priyanka Desai', 3, 3, 2, 3, -50, 40),
('R-21', 'Breach of the General Insurance Code of Practice', 'Code obligations on claims, complaints and vulnerable customers are not met.', 'Regulatory', 'Priyanka Desai', 3, 3, 2, 2, -30, 60),
('R-22', 'APRA returns late or wrong', 'Quarterly statistical and financial returns are lodged late or with errors.', 'Regulatory', 'Daniel Okafor', 3, 3, 2, 2, -75, 15),
('R-23', 'Claim paid to a sanctioned person', 'A claim or refund is paid to a person or entity on a sanctions list.', 'Regulatory', 'Priyanka Desai', 2, 3, 1, 3, -60, 30),
('R-24', 'Privacy Act breach involving customer data', 'Customer personal information is disclosed, lost or used outside the Australian Privacy Principles.', 'Regulatory', 'Ruby Nguyen', 3, 4, 2, 2, -40, 50),
('R-25', 'Vulnerable customers treated unfairly in claims', 'Customers in hardship or with family violence concerns are not identified and supported.', 'Conduct', 'Grace Liu', 3, 4, 2, 3, -60, 30),
('R-26', 'Renewal pricing penalises loyal customers', 'Long-standing customers pay materially more than new customers for the same cover.', 'Conduct', 'Grace Liu', 3, 4, 3, 3, -98, -8),
('R-27', 'Add-on insurance mis-sold through brokers', 'Add-on cover is sold to customers it does not suit.', 'Conduct', 'Grace Liu', 3, 3, 2, 2, -45, 45),
('R-28', 'Complaints not resolved inside AFCA timeframes', 'Internal dispute resolution runs past 30 days and customers go to AFCA.', 'Conduct', 'Grace Liu', 3, 3, 2, 3, -30, 60),
('R-29', 'Capital falls below the board''s target', 'The PCA coverage ratio falls below the target range in the capital management plan.', 'Financial', 'Daniel Okafor', 2, 5, 1, 5, -25, 65),
('R-30', 'Investment portfolio losses', 'Market falls reduce the value of the investment portfolio backing technical reserves.', 'Financial', 'Daniel Okafor', 3, 3, 2, 3, -50, 40),
('R-31', 'Liquidity strain after a major catastrophe', 'Claim payments after an event outrun cash and reinsurance recoveries.', 'Financial', 'Daniel Okafor', 2, 4, 1, 4, -50, 40),
('R-32', 'Broker premiums not collected', 'Premiums collected by brokers are not passed on within terms.', 'Financial', 'Daniel Okafor', 3, 2, 2, 2, -70, 20),
('R-33', 'Loss of key actuarial and underwriting staff', 'A small number of people hold the pricing, reserving and underwriting knowledge.', 'People', 'Tom Hughes', 3, 3, 2, 3, -90, 90),
('R-34', 'Assessor or contractor injured at a damaged property', 'Staff or contractors are hurt entering storm, fire or flood damaged homes.', 'People', 'Tom Hughes', 2, 4, 2, 3, -120, 60),
('R-35', 'Staff misconduct and undeclared conflicts', 'Staff approve claims or suppliers where they have an undeclared interest.', 'People', '', 2, 4, 1, 4, -200, -20),
('R-36', 'Head office unavailable after a major event', 'The main office cannot be used after fire, flood or a prolonged power outage.', 'Operational', 'Sarah Whitfield', 2, 5, 2, 4, -120, -30),
('R-37', 'Manual errors in policy issuance', 'Manual changes to policies produce wrong cover, sums insured or premiums.', 'Operational', 'Sarah Whitfield', 4, 2, 3, 2, -50, 40),
('R-38', 'Claim payments redirected by fraudsters', 'A fraudster changes a claimant''s or supplier''s bank details and diverts a payment.', 'Operational', 'Daniel Okafor', 3, 4, 2, 4, -40, 50),
('R-39', 'Climate change makes cover unaffordable', 'Rising catastrophe costs push premiums beyond what customers in exposed regions will pay.', 'Strategic', 'Anita Raman', 4, 4, 4, 3, -60, 120),
('R-40', 'Loss of a major broker partner', 'The largest broker group moves its book to a competitor.', 'Strategic', 'Grace Liu', 3, 4, 3, 4, -70, 110)
) v(ref, title, descr, cat, owner, il, ic, rl, rc, lr, nr)
on conflict do nothing;

-- Rating history. Earlier reviews first, so movement can show what changed and why.
insert into risk_reviews (risk_id, reviewer, reviewed_on, residual_likelihood, residual_consequence, note)
select r.id, v.who, current_date + v.d, v.l, v.c, v.note from (values
('R-01', 'James Kovac', -130, 2, 4, 'Catastrophe programme renewed at the same limit.'),
('R-01', 'James Kovac', -40, 3, 4, 'Catastrophe model refreshed after the winter storms; the modelled 1-in-200 loss now sits above the programme.'),
('R-07', 'Megan O''Rourke', -140, 3, 4, 'Fraud ring found across 27 motor claims.'),
('R-07', 'Megan O''Rourke', -50, 2, 4, 'Fraud scoring now runs on every motor claim.'),
('R-09', 'Megan O''Rourke', -100, 2, 3, 'Claims ageing inside Code timeframes.'),
('R-09', 'Megan O''Rourke', -10, 3, 3, 'Backlog after the August storms; the claims ageing control failed its test.'),
('R-10', 'Nadia Haddad', -185, 2, 5, 'Endpoint detection rolled out to every device.'),
('R-10', 'Nadia Haddad', -95, 3, 5, 'Phishing click rate up and two core systems out of support.'),
('R-12', 'Nadia Haddad', -120, 2, 4, 'Broker portal on multi-factor sign-in.'),
('R-12', 'Nadia Haddad', -30, 2, 5, 'Portal holds more customer data than first assessed; consequence raised.'),
('R-14', 'Liam Tran', -130, 3, 3, 'Cut-over plan drafted.'),
('R-14', 'Liam Tran', -40, 2, 3, 'Migration rehearsal passed with rollback tested.'),
('R-22', 'Daniel Okafor', -165, 3, 2, 'One return lodged late last year.'),
('R-22', 'Daniel Okafor', -75, 2, 2, 'Reporting calendar and sign-off now in place.'),
('R-29', 'Daniel Okafor', -115, 2, 5, 'PCA coverage close to the bottom of the target range.'),
('R-29', 'Daniel Okafor', -25, 1, 5, 'Capital injection from the parent completed; coverage back in range.')
) v(ref, who, d, l, c, note) join risks r on r.reference = v.ref
where not exists (select 1 from risk_reviews x where x.risk_id = r.id and x.reviewed_on = current_date + v.d);

insert into risk_reviews (risk_id, reviewer, reviewed_on, residual_likelihood, residual_consequence, note)
select r.id, coalesce(nullif(r.owner, ''), 'Anita Raman'), r.last_reviewed_on, r.residual_likelihood, r.residual_consequence, 'Quarterly review: rating confirmed.'
from risks r where r.last_reviewed_on is not null
  and not exists (select 1 from risk_reviews x where x.risk_id = r.id and x.reviewed_on = r.last_reviewed_on);

-- ------------------------------------------------------------------ controls (60) and their tests
insert into controls (risk_id, reference, title, owner, kind, effectiveness, test_every_days, last_tested_on)
select r.id, v.ref, v.title, v.owner, v.kind, v.eff, v.every, current_date + v.tested from (values
('R-01', 'C-01', 'Catastrophe reinsurance programme placed and approved by the board each year', 'James Kovac', 'preventive', 'effective', 365, -120),
('R-01', 'C-02', 'Quarterly catastrophe model run against the reinsurance limit', 'Ben Castellano', 'detective', 'effective', 90, -60),
('R-02', 'C-03', 'Monthly pricing adequacy review against loss ratios', 'James Kovac', 'detective', 'partially-effective', 90, -100),
('R-02', 'C-04', 'Rate changes approved by the pricing committee', 'James Kovac', 'preventive', 'effective', 180, -50),
('R-03', 'C-05', 'Quarterly reserve review by the Appointed Actuary', 'Ben Castellano', 'detective', 'effective', 90, -30),
('R-03', 'C-06', 'Independent peer review of reserving assumptions', 'Ben Castellano', 'detective', 'not-tested', 365, null),
('R-04', 'C-07', 'Reinsurer credit rating floor of A- in the reinsurance policy', 'Daniel Okafor', 'preventive', 'effective', 365, -200),
('R-05', 'C-08', 'Postcode accumulation limits in the rating engine', 'James Kovac', 'preventive', 'partially-effective', 180, -210),
('R-06', 'C-09', 'Claims payment authority limits', 'Megan O''Rourke', 'preventive', 'ineffective', 90, -40),
('R-06', 'C-10', 'Monthly claims file quality audit', 'Megan O''Rourke', 'detective', 'partially-effective', 30, -20),
('R-07', 'C-11', 'Fraud scoring on every motor claim', 'Megan O''Rourke', 'detective', 'effective', 180, -90),
('R-07', 'C-12', 'Referral of suspect claims to the special investigations unit', 'Megan O''Rourke', 'detective', 'effective', 180, -150),
('R-08', 'C-13', 'Catastrophe surge staffing plan with partner call centres', 'Megan O''Rourke', 'corrective', 'partially-effective', 365, -400),
('R-09', 'C-14', 'Daily claims ageing report against Code timeframes', 'Megan O''Rourke', 'detective', 'ineffective', 30, -45),
('R-10', 'C-15', 'Endpoint detection and response on every device', 'Nadia Haddad', 'detective', 'effective', 180, -70),
('R-10', 'C-16', 'Immutable offline backups of policy and claims data', 'Nadia Haddad', 'corrective', 'effective', 180, -100),
('R-10', 'C-17', 'Quarterly phishing simulation and training', 'Nadia Haddad', 'preventive', 'partially-effective', 90, -25),
('R-11', 'C-18', 'Policy system failover to the secondary region', 'Liam Tran', 'corrective', 'effective', 180, -150),
('R-12', 'C-19', 'Multi-factor sign-in on the broker portal', 'Nadia Haddad', 'preventive', 'effective', 180, -60),
('R-12', 'C-20', 'Independent penetration test of customer-facing portals', 'Nadia Haddad', 'detective', 'partially-effective', 365, -300),
('R-13', 'C-21', 'Monthly patch compliance reporting', 'Liam Tran', 'detective', 'ineffective', 30, -50),
('R-14', 'C-22', 'Migration go/no-go checklist with rollback plan', 'Liam Tran', 'preventive', 'not-tested', 180, null),
('R-15', 'C-23', 'Contact centre service level reporting from the provider', 'Sarah Whitfield', 'detective', 'effective', 90, -45),
('R-15', 'C-24', 'Alternate site arrangement for claim calls', 'Sarah Whitfield', 'corrective', 'partially-effective', 365, -200),
('R-16', 'C-25', 'Annual assurance review of the hosting provider', 'Liam Tran', 'preventive', 'effective', 365, -100),
('R-16', 'C-26', 'Cloud exit plan', 'Liam Tran', 'corrective', 'not-tested', 365, null),
('R-17', 'C-27', 'Builder panel capacity agreements with surge clauses', 'Megan O''Rourke', 'preventive', 'partially-effective', 365, -180),
('R-18', 'C-28', 'Daily payment file reconciliation', 'Daniel Okafor', 'detective', 'effective', 30, -10),
('R-19', 'C-29', 'Incident materiality assessment within 24 hours', 'Priyanka Desai', 'detective', 'effective', 180, -60),
('R-19', 'C-30', 'APRA notification procedure and contact list', 'Priyanka Desai', 'preventive', 'effective', 365, -90),
('R-20', 'C-31', 'Target market determination review before launch', 'Priyanka Desai', 'preventive', 'partially-effective', 180, -90),
('R-21', 'C-32', 'Code compliance monitoring program', 'Priyanka Desai', 'detective', 'effective', 180, -120),
('R-22', 'C-33', 'Regulatory reporting calendar with sign-off', 'Daniel Okafor', 'preventive', 'effective', 90, -100),
('R-22', 'C-34', 'Reconciliation of APRA returns to the general ledger', 'Daniel Okafor', 'detective', 'effective', 90, -40),
('R-23', 'C-35', 'Sanctions screening of claim payees', 'Priyanka Desai', 'preventive', 'effective', 180, -80),
('R-24', 'C-36', 'Privacy impact assessments for new systems', 'Ruby Nguyen', 'preventive', 'partially-effective', 365, -200),
('R-24', 'C-37', 'Data breach response plan', 'Ruby Nguyen', 'corrective', 'effective', 365, -150),
('R-25', 'C-38', 'Vulnerable customer identification in claims', 'Grace Liu', 'detective', 'partially-effective', 180, -100),
('R-25', 'C-39', 'Second review of every claim decline', 'Grace Liu', 'detective', 'effective', 90, -30),
('R-26', 'C-40', 'Renewal pricing fairness review', 'Grace Liu', 'detective', 'not-tested', 180, null),
('R-27', 'C-41', 'Broker sales monitoring and file reviews', 'Grace Liu', 'detective', 'effective', 180, -90),
('R-28', 'C-42', 'Complaints ageing dashboard', 'Grace Liu', 'detective', 'effective', 30, -15),
('R-28', 'C-43', 'Escalation of complaints at 21 days', 'Grace Liu', 'corrective', 'effective', 90, -60),
('R-29', 'C-44', 'Monthly capital position report to the board', 'Daniel Okafor', 'detective', 'effective', 30, -12),
('R-29', 'C-45', 'Capital management plan with triggers', 'Daniel Okafor', 'preventive', 'effective', 365, -150),
('R-30', 'C-46', 'Investment mandate limits monitored by the custodian', 'Daniel Okafor', 'detective', 'effective', 90, -50),
('R-31', 'C-47', 'Catastrophe liquidity facility', 'Daniel Okafor', 'corrective', 'effective', 365, -250),
('R-32', 'C-48', 'Broker premium ageing and suspension', 'Daniel Okafor', 'detective', 'partially-effective', 90, -120),
('R-33', 'C-49', 'Succession plans for key actuarial and underwriting roles', 'Tom Hughes', 'preventive', 'partially-effective', 365, -300),
('R-34', 'C-50', 'Site safety assessment before entering a damaged home', 'Tom Hughes', 'preventive', 'effective', 180, -80),
('R-34', 'C-51', 'Contractor safety induction', 'Tom Hughes', 'preventive', 'partially-effective', 365, -100),
('R-35', 'C-52', 'Annual conflicts of interest declarations', 'Tom Hughes', 'detective', 'effective', 365, -200),
('R-36', 'C-53', 'Work-from-home capability tested quarterly', 'Sarah Whitfield', 'corrective', 'effective', 90, -95),
('R-36', 'C-54', 'Head office evacuation and recovery plan', 'Sarah Whitfield', 'corrective', 'effective', 365, -300),
('R-37', 'C-55', 'Four-eyes check on manual policy changes', 'Sarah Whitfield', 'preventive', 'partially-effective', 90, -60),
('R-38', 'C-56', 'Call-back before changing a payee''s bank details', 'Daniel Okafor', 'preventive', 'effective', 90, -30),
('R-38', 'C-57', 'Bank account verification for new payees', 'Daniel Okafor', 'preventive', 'effective', 180, -120),
('R-39', 'C-58', 'Climate scenario analysis in the business plan', 'Anita Raman', 'detective', 'partially-effective', 365, -330),
('R-40', 'C-59', 'Relationship reviews with the top ten brokers', 'Grace Liu', 'detective', 'effective', 180, -90),
('R-11', 'C-60', 'Policy system capacity and performance monitoring', 'Liam Tran', 'detective', 'effective', 30, -20)
) v(risk, ref, title, owner, kind, eff, every, tested) join risks r on r.reference = v.risk
on conflict do nothing;

insert into control_tests (control_id, tested_on, tester, result, evidence, note)
select c.id, c.last_tested_on, case when c.test_every_days >= 180 then 'Mark Delaney' else c.owner end, c.effectiveness,
  'grc://control-tests/' || lower(r.reference) || '-' || lower(c.reference) || '/' || to_char(c.last_tested_on, 'YYYY-MM'),
  case c.reference
    when 'C-09' then 'Seven of 40 sampled payments were above the approver''s limit.'
    when 'C-14' then 'Report ran but 640 claims past the Code timeframe were not escalated.'
    when 'C-21' then '19 critical patches were more than 30 days overdue at the test date.'
    when 'C-13' then 'Plan ran during the hailstorm; partner capacity arrived two days late.'
    else '' end
from controls c join risks r on r.id = c.risk_id
where c.last_tested_on is not null and not exists (select 1 from control_tests t where t.control_id = c.id and t.tested_on = c.last_tested_on);

-- ------------------------------------------------------------------ CPS 230: critical operations and providers
insert into critical_operations (reference, name, owner, max_outage_hours, max_data_loss_hours, min_service_level, last_exercise_on, bcp_reviewed_on)
select v.ref, v.name, v.owner, v.outage, v.loss, v.level, current_date + v.ex, current_date + v.bcp from (values
('OP-1', 'Policy servicing and renewals', 'Sarah Whitfield', 48::numeric, 4::numeric, 'Renewals issued and policy changes made within 2 business days', -200, -200),
('OP-2', 'Claims lodgement', 'Megan O''Rourke', 4, 1, 'Claims lodged by phone or online, calls answered inside 10 minutes', -400, -300),
('OP-3', 'Claims payments', 'Daniel Okafor', 24, 0.5, 'Emergency and hardship payments made the same day', -150, -380),
('OP-4', 'Catastrophe response', 'Megan O''Rourke', 12, null, 'Assessors on site within 72 hours of a declared catastrophe', null, -100),
('OP-5', 'New business and quotes', 'James Kovac', 72, 24, '', -90, -90)
) v(ref, name, owner, outage, loss, level, ex, bcp)
on conflict do nothing;

insert into service_providers (reference, name, service, owner, material, critical_operation_id, agreement_changed_on, regulator_notified_on, last_reviewed_on)
select v.ref, v.name, v.service, v.owner, v.material, o.id, current_date + v.changed, current_date + v.notified, current_date + v.reviewed from (values
('SP-01', 'Corvane Cloud Services', 'Hosting for the policy and claims platforms', 'Liam Tran', true, 'OP-1', -12, null, -100),
('SP-02', 'Arkwell Policy Systems', 'Policy administration software as a service', 'Liam Tran', true, 'OP-1', null, null, -420),
('SP-03', 'Fenmoor Contact Centres', 'Outsourced claims call centre', 'Sarah Whitfield', true, 'OP-2', -45, null, -150),
('SP-04', 'Norvale Payments', 'Claim payment file processing', 'Daniel Okafor', true, 'OP-3', -300, -290, -200),
('SP-05', 'Pemberly Claims Assist', 'After-hours claims triage line', 'Megan O''Rourke', true, 'OP-2', null, null, -150),
('SP-06', 'Tarrant Loss Adjusters', 'Loss adjusting panel for large and catastrophe claims', 'Megan O''Rourke', true, 'OP-4', null, null, -380),
('SP-07', 'Quillon Data Backup', 'Offsite immutable backups', 'Nadia Haddad', true, 'OP-3', null, null, -60),
('SP-08', 'Brackenridge Building Panel', 'Builder network for home claims', 'Megan O''Rourke', true, 'OP-4', null, null, -90),
('SP-09', 'Stratlin Print and Mail', 'Printing and posting renewal notices', 'Sarah Whitfield', false, null, null, null, -300),
('SP-10', 'Velmora Identity', 'Identity verification for online quotes', 'James Kovac', false, null, null, null, -200)
) v(ref, name, service, owner, material, op, changed, notified, reviewed) left join critical_operations o on o.reference = v.op
on conflict do nothing;

-- ------------------------------------------------------------------ incidents (15)
insert into incidents (reference, title, description, kind, severity, owner, occurred_at, aware_at, risk_id, critical_operation_id,
  material_impact, outside_tolerance, regulator_notified_at, privacy_breach, privacy_jurisdiction, privacy_assessed_on, privacy_notifiable, privacy_notified_on, status, closed_on, root_cause)
select v.ref, v.title, v.descr, v.kind, v.sev, v.owner, now() - v.occurred, now() - v.aware, r.id, o.id,
  v.material, v.outside, now() - v.aware + v.notified_after, v.privacy is not null, v.privacy, current_date + v.assessed, v.notifiable, null::date,
  case when v.closed is null then 'open' else 'closed' end, current_date + v.closed, v.cause from (values
('INC-101', 'Ransomware email opened by a claims officer, stopped by endpoint protection', 'A claims officer opened a malicious attachment. Endpoint detection isolated the laptop within four minutes. No data left the network.', 'near-miss', 'minor', 'Nadia Haddad', interval '75 days', interval '75 days', 'R-10', null, false, false, null::interval, null, null::int, null::boolean, -70, 'The email passed the mail filter; endpoint protection stopped the payload.'),
('INC-102', 'Claims call centre down for 11 hours during the hailstorm surge', 'The outsourced call centre''s telephony failed under load on the first morning of the hailstorm. Claim calls went unanswered from 07:30 to 18:30.', 'incident', 'major', 'Sarah Whitfield', interval '60 days 3 hours', interval '60 days', 'R-15', 'OP-2', true, true, interval '20 hours', null, null, null, -30, 'Provider telephony platform failed under load; overflow to the alternate site had never been tested.'),
('INC-103', 'Policy schedules emailed to the wrong broker', 'Schedules for 12 customers were sent to a broker with a similar name. The broker confirmed deletion the same day.', 'incident', 'moderate', 'Ruby Nguyen', interval '50 days', interval '50 days', 'R-24', null, false, false, null, 'AU', -40, false, -38, 'Broker picked from an autocomplete list without a check.'),
('INC-104', 'Duplicate claim payments after a payment file was run twice', '38 claimants were paid twice, a total of $212,400, after the daily payment file was resubmitted.', 'incident', 'moderate', 'Daniel Okafor', interval '40 days', interval '40 days', 'R-06', 'OP-3', false, false, null, null, null, null, null, ''),
('INC-105', 'Organised motor fraud ring found across 27 claims', 'Network analysis linked 27 motor claims to the same repairer and two tow operators.', 'incident', 'moderate', 'Megan O''Rourke', interval '125 days', interval '120 days', 'R-07', null, false, false, null, null, null, null, -90, 'Repairer collusion; claims were not compared across the network.'),
('INC-106', 'Renewal batch failed and 3,400 renewal notices were not issued', 'The overnight renewal batch stopped on a data error. Notices went out five days late.', 'incident', 'moderate', 'Liam Tran', interval '25 days', interval '25 days', 'R-11', 'OP-1', false, false, null, null, null, null, null, ''),
('INC-107', 'Unauthorised access to the broker portal using stolen credentials', 'Credentials for three broker users were used from overseas to view 1,850 customer policy records over two days.', 'incident', 'severe', 'Nadia Haddad', interval '11 days', interval '9 days', 'R-12', null, true, false, interval '40 hours', 'AU', null, null, null, ''),
('INC-108', 'Claims lodgement backlog breached Code timeframes for 640 claims', 'After the August storms, 640 claims were not acknowledged or decided within General Insurance Code timeframes.', 'incident', 'major', 'Megan O''Rourke', interval '18 days', interval '18 days', 'R-09', 'OP-2', false, false, null, null, null, null, null, ''),
('INC-109', 'APRA quarterly return lodged two days late', 'The quarterly return was lodged two days after the due date because of a ledger reconciliation break.', 'incident', 'minor', 'Daniel Okafor', interval '80 days', interval '80 days', 'R-22', null, false, false, null, null, null, null, -78, 'Reconciliation break found late; no buffer in the reporting calendar.'),
('INC-110', 'Builder panel could not meet storm demand in south-east Queensland', 'Repairs for 900 homes waited more than six weeks for a builder.', 'incident', 'moderate', 'Megan O''Rourke', interval '55 days', interval '55 days', 'R-17', 'OP-4', false, false, null, null, null, null, -20, 'Panel agreements had no surge clause in the region.'),
('INC-111', 'Hosting region degraded, claims lodgement down for 5 hours', 'The hosting provider''s primary region degraded. Online and phone claim lodgement was unavailable for five hours, past the four hour tolerance.', 'incident', 'major', 'Liam Tran', interval '15 hours', interval '10 hours', 'R-16', 'OP-2', true, true, null, null, null, null, null, ''),
('INC-112', 'Claim decline for a customer in hardship escalated to AFCA', 'A home claim from a customer in financial hardship was declined without the second review; the customer went to AFCA.', 'incident', 'moderate', 'Grace Liu', interval '35 days', interval '35 days', 'R-25', null, false, false, null, null, null, null, null, ''),
('INC-113', 'Encrypted staff laptop left on a train', 'An encrypted laptop was left on a train and reported within the hour. It was wiped remotely.', 'incident', 'minor', 'Ruby Nguyen', interval '100 days', interval '100 days', 'R-24', null, false, false, null, 'AU', -98, false, -95, 'Laptop left unattended; device was encrypted and wiped.'),
('INC-114', 'Wrong premium on 1,200 home renewals after a rating table change', 'A rating table change applied the wrong postcode loading. 1,200 renewal notices showed a premium up to 18% too high.', 'incident', 'major', 'James Kovac', interval '15 days', interval '14 days', null, 'OP-1', false, false, null, null, null, null, null, ''),
('INC-115', 'Contractor injured at a storm-damaged property', 'A roofing contractor fell through a damaged ceiling while inspecting a claim.', 'incident', 'moderate', 'Tom Hughes', interval '45 days', interval '45 days', 'R-34', null, false, false, null, null, null, null, null, '')
) v(ref, title, descr, kind, sev, owner, occurred, aware, risk, op, material, outside, notified_after, privacy, assessed, notifiable, closed, cause)
left join risks r on r.reference = v.risk left join critical_operations o on o.reference = v.op
on conflict do nothing;

-- ------------------------------------------------------------------ actions
insert into actions (risk_id, incident_id, reference, title, owner, due_on, status, completed_on, evidence)
select r.id, i.id, v.ref, v.title, v.owner, current_date + v.due, case when v.done is null then 'open' else 'done' end, current_date + v.done, v.evidence from (values
('R-01', null, 'A-01', 'Buy an additional catastrophe reinsurance layer for the 2027 programme', 'James Kovac', 60, null::int, ''),
('R-08', null, 'A-02', 'Sign surge agreements with two partner call centres', 'Megan O''Rourke', -20, null, ''),
('R-09', null, 'A-03', 'Clear the claims backlog and add 15 temporary assessors', 'Megan O''Rourke', 14, null, ''),
('R-10', null, 'A-04', 'Segment the claims network from the corporate network', 'Nadia Haddad', -8, null, ''),
('R-10', null, 'A-05', 'Run a ransomware tabletop exercise with the executive', 'Nadia Haddad', 30, null, ''),
('R-12', null, 'A-06', 'Move the broker portal to the new identity platform', 'Nadia Haddad', 45, null, ''),
('R-20', null, 'A-07', 'Review every target market determination issued in 2026', 'Priyanka Desai', -3, null, ''),
('R-06', null, 'A-08', 'Enforce payment authority limits in the claims system', 'Megan O''Rourke', 21, null, ''),
('R-38', null, 'A-09', 'Roll out bank account verification for all payees', 'Daniel Okafor', -35, -30, 'change://2026/payee-verification'),
('R-07', null, 'A-10', 'Extend fraud scoring to home claims', 'Megan O''Rourke', -50, -55, 'change://2026/fraud-scoring-home'),
('R-24', null, 'A-11', 'Refresh privacy training for claims staff', 'Ruby Nguyen', 40, null, ''),
('R-17', null, 'A-12', 'Add two builder panels in regional Queensland', 'Megan O''Rourke', 30, null, ''),
(null, 'INC-104', 'A-13', 'Recover the duplicate payments from 38 claimants', 'Daniel Okafor', 10, null, ''),
(null, 'INC-108', 'A-14', 'Write to affected customers with an apology and a timeframe', 'Megan O''Rourke', -2, null, ''),
(null, 'INC-107', 'A-15', 'Force a password reset for every broker portal user', 'Nadia Haddad', -8, -8, 'change://2026/broker-password-reset'),
(null, 'INC-107', 'A-16', 'Forensic review of the broker portal access logs', 'Nadia Haddad', 5, null, ''),
(null, 'INC-111', 'A-17', 'Post-incident review of the hosting failover', 'Liam Tran', 7, null, ''),
(null, 'INC-114', 'A-18', 'Re-issue the renewal notices with the correct premium', 'James Kovac', 6, null, ''),
(null, 'INC-112', 'A-19', 'Respond to AFCA with the claim file review', 'Grace Liu', 4, null, ''),
(null, 'INC-115', 'A-20', 'Review the site safety assessment with the contractor', 'Tom Hughes', -5, null, ''),
(null, 'INC-106', 'A-21', 'Fix the renewal batch and add a failure alert', 'Liam Tran', -15, -15, 'change://2026/renewal-batch-alert'),
(null, 'INC-102', 'A-22', 'Write and test the alternate site overflow playbook', 'Sarah Whitfield', -40, -40, 'bcp://2026/claims-overflow-playbook')
) v(risk, inc, ref, title, owner, due, done, evidence)
left join risks r on r.reference = v.risk left join incidents i on i.reference = v.inc
on conflict do nothing;

-- ------------------------------------------------------------------ obligations (30) and attestations
insert into obligations (reference, title, source, owner, attest_every_days) values
('OB-01', 'Notify APRA of material operational risk incidents within 72 hours', 'APRA CPS 230 para 33', 'Priyanka Desai', 90),
('OB-02', 'Notify APRA within 24 hours of a critical operation disrupted outside tolerance', 'APRA CPS 230 para 42', 'Sarah Whitfield', 90),
('OB-03', 'Run an annual business continuity exercise for every critical operation', 'APRA CPS 230 para 43', 'Sarah Whitfield', 365),
('OB-04', 'Notify APRA of new or materially changed arrangements with material service providers', 'APRA CPS 230 para 59', 'Sarah Whitfield', 180),
('OB-05', 'Maintain an information security capability that matches the threats', 'APRA CPS 234 Information Security', 'Nadia Haddad', 365),
('OB-06', 'Notify APRA of material information security incidents within 72 hours', 'APRA CPS 234 Information Security', 'Nadia Haddad', 365),
('OB-07', 'Hold capital above the prudential capital requirement', 'APRA GPS 110 Capital Adequacy', 'Daniel Okafor', 90),
('OB-08', 'Appointed Actuary delivers the Financial Condition Report each year', 'APRA GPS 320 Actuarial and Related Matters', 'Ben Castellano', 365),
('OB-09', 'Keep a board-approved reinsurance management strategy', 'APRA GPS 230 Reinsurance Management', 'James Kovac', 365),
('OB-10', 'Assess the fitness and propriety of every responsible person', 'APRA CPS 520 Fit and Proper', 'Tom Hughes', 365),
('OB-11', 'Keep a risk management strategy and make the annual risk management declaration', 'APRA CPS 220 Risk Management', 'Anita Raman', 365),
('OB-12', 'Keep a board-approved remuneration policy', 'APRA CPS 511 Remuneration', 'Tom Hughes', 365),
('OB-13', 'Keep accountability statements and the accountability map current', 'Financial Accountability Regime Act 2023 (Cth)', 'Anita Raman', 180),
('OB-14', 'Report reportable situations to ASIC within 30 days', 'Corporations Act 2001 (Cth) s912DAA', 'Priyanka Desai', 90),
('OB-15', 'Keep a target market determination for every retail product', 'Corporations Act 2001 (Cth) Part 7.8A', 'Grace Liu', 365),
('OB-16', 'Provide financial services, including claims handling, efficiently, honestly and fairly', 'Corporations Act 2001 (Cth) s912A', 'Megan O''Rourke', 180),
('OB-17', 'Resolve complaints inside the internal dispute resolution timeframes', 'ASIC Regulatory Guide 271', 'Grace Liu', 90),
('OB-18', 'Take reasonable care to explain the duty not to make a misrepresentation', 'Insurance Contracts Act 1984 (Cth) s20B', 'James Kovac', 365),
('OB-19', 'Act with utmost good faith in handling claims', 'Insurance Contracts Act 1984 (Cth) s13', 'Megan O''Rourke', 365),
('OB-20', 'Meet the claims timeframes in the General Insurance Code of Practice', 'General Insurance Code of Practice', 'Megan O''Rourke', 90),
('OB-21', 'Do not make unsolicited offers of insurance', 'Corporations Act 2001 (Cth) s992A', 'Grace Liu', 365),
('OB-22', 'Keep a clearly expressed, current privacy policy', 'Privacy Act 1988 (Cth) APP 1', 'Ruby Nguyen', 365),
('OB-23', 'Assess suspected eligible data breaches within 30 days', 'Privacy Act 1988 (Cth) s26WH', 'Ruby Nguyen', 90),
('OB-24', 'Screen claim payees against the sanctions lists', 'Autonomous Sanctions Act 2011 (Cth)', 'Priyanka Desai', 365),
('OB-25', 'Lodge APRA reporting returns on time', 'Financial Sector (Collection of Data) Act 2001 (Cth)', 'Daniel Okafor', 90),
('OB-26', 'Keep assessors and contractors safe on site', 'Work Health and Safety Act 2011 (Cth)', 'Tom Hughes', 365),
('OB-27', 'Send marketing messages only with consent and an unsubscribe', 'Spam Act 2003 (Cth)', 'Grace Liu', 365),
('OB-28', 'Keep unfair terms out of standard form insurance contracts', 'ASIC Act 2001 (Cth) s12BF', 'James Kovac', 365),
('OB-29', 'Prepare the annual sustainability report with climate disclosures', 'Corporations Act 2001 (Cth) Chapter 2M', 'Daniel Okafor', 365),
('OB-30', 'Keep a whistleblower policy available to staff', 'Corporations Act 2001 (Cth) s1317AI', 'Tom Hughes', 365)
on conflict do nothing;

insert into attestations (obligation_id, attested_on, attested_by, outcome, evidence, note)
select ob.id, current_date + v.d, ob.owner, v.outcome, v.evidence, v.note from (values
('OB-01', -60, 'compliant', 'committee://2026/q3-risk-pack', ''),
('OB-02', -60, 'compliant', 'committee://2026/q3-risk-pack', 'INC-102 notified 20 hours after awareness.'),
('OB-03', -200, 'partial', 'bcp://2026/exercise-report', 'OP-2 and OP-4 exercises were not run.'),
('OB-04', -200, 'compliant', 'committee://2026/q1-risk-pack', ''),
('OB-05', -150, 'compliant', 'audit://2026/cps234-assessment', ''),
('OB-06', -150, 'compliant', 'audit://2026/cps234-assessment', ''),
('OB-07', -20, 'compliant', 'board://2026/capital-report-september', ''),
('OB-08', -100, 'compliant', 'board://2026/financial-condition-report', ''),
('OB-09', -250, 'compliant', 'board://2026/reinsurance-strategy', ''),
('OB-10', -380, 'compliant', 'people://2025/fit-and-proper-register', ''),
('OB-11', -120, 'compliant', 'board://2026/risk-management-declaration', ''),
('OB-12', -200, 'compliant', 'board://2026/remuneration-policy', ''),
('OB-13', -100, 'compliant', 'board://2026/accountability-map', ''),
('OB-14', -45, 'compliant', 'compliance://2026/breach-register-review', ''),
('OB-15', -90, 'partial', 'compliance://2026/tmd-register', 'Two add-on products have no current target market determination.'),
('OB-16', -60, 'compliant', 'compliance://2026/claims-conduct-review', ''),
('OB-17', -30, 'partial', 'compliance://2026/idr-report-september', '11 complaints ran past 30 days.'),
('OB-18', -200, 'compliant', 'compliance://2026/duty-of-disclosure-scripts', ''),
('OB-19', -200, 'compliant', 'compliance://2026/claims-conduct-review', ''),
('OB-20', -15, 'breach', 'compliance://2026/code-timeframes-september', '640 claims outside Code timeframes after the August storms. Logged as INC-108.'),
('OB-21', -300, 'compliant', 'compliance://2025/hawking-review', ''),
('OB-22', -50, 'compliant', 'web://privacy-policy', ''),
('OB-23', -100, 'compliant', 'privacy://2026/breach-register', ''),
('OB-24', -180, 'compliant', 'compliance://2026/sanctions-screening-test', ''),
('OB-25', -10, 'compliant', 'finance://2026/apra-returns-q3', ''),
('OB-26', -100, 'compliant', 'people://2026/whs-report', ''),
('OB-27', -330, 'compliant', 'marketing://2025/consent-audit', ''),
('OB-29', -30, 'compliant', 'board://2026/sustainability-report-plan', ''),
('OB-30', -400, 'compliant', 'people://2025/whistleblower-policy', '')
) v(ref, d, outcome, evidence, note) join obligations ob on ob.reference = v.ref
where not exists (select 1 from attestations a where a.obligation_id = ob.id and a.attested_on = current_date + v.d);

-- ------------------------------------------------------------------ key risk indicators (10) and readings
insert into key_risk_indicators (reference, name, description, owner, risk_id, critical_operation_id, unit, direction, amber_threshold, red_threshold, measure_every_days)
select v.ref, v.name, v.descr, v.owner, r.id, o.id, v.unit, v.dir, v.amber, v.red, v.every from (values
('KRI-01', 'Claims outside Code timeframes', 'Share of open claims past a General Insurance Code timeframe at month end.', 'Megan O''Rourke', 'R-09', 'OP-2', '%', 'higher', 5::numeric, 10::numeric, 30),
('KRI-02', 'Phishing simulation click rate', 'Share of staff who clicked the link in the monthly phishing simulation.', 'Nadia Haddad', 'R-10', null, '%', 'higher', 5, 10, 30),
('KRI-03', 'Critical patches overdue more than 30 days', 'Count of critical security patches not applied within 30 days of release.', 'Liam Tran', 'R-13', null, 'patches', 'higher', 5, 15, 30),
('KRI-04', 'Claims lodgement availability', 'Monthly availability of online and phone claim lodgement.', 'Liam Tran', 'R-16', 'OP-2', '%', 'lower', 99.5, 99.0, 30),
('KRI-05', 'Claims leakage found in file audits', 'Over-payment found in the monthly claims file audit, as a share of the amount paid.', 'Megan O''Rourke', 'R-06', 'OP-3', '%', 'higher', 2, 3, 30),
('KRI-06', 'Complaints open more than 30 days', 'Count of complaints in internal dispute resolution for more than 30 days.', 'Grace Liu', 'R-28', null, 'complaints', 'higher', 10, 20, 30),
('KRI-07', 'PCA coverage ratio', 'Eligible capital as a multiple of the prescribed capital amount.', 'Daniel Okafor', 'R-29', null, 'x', 'lower', 1.6, 1.4, 30),
('KRI-08', 'Claims staff turnover', 'Annualised voluntary turnover in the claims team.', 'Tom Hughes', 'R-33', null, '%', 'higher', 18, 25, 30),
('KRI-09', 'Material providers without a current assurance review', 'Material service providers whose last assurance review is more than a year old.', 'Sarah Whitfield', 'R-15', null, 'providers', 'higher', 1, 3, 30),
('KRI-10', 'Catastrophe reinsurance limit used this year', 'Share of the annual catastrophe reinsurance limit used by events so far this year.', 'James Kovac', 'R-01', null, '%', 'higher', 60, 80, 92)
) v(ref, name, descr, owner, risk, op, unit, dir, amber, red, every)
left join risks r on r.reference = v.risk left join critical_operations o on o.reference = v.op
on conflict do nothing;

-- m is months back: 0 is this month (in the last three days, never before the 1st), 1 is the 28th of last month, and so on.
insert into kri_readings (kri_id, measured_on, value, recorded_by, note)
select k.id,
  case when v.m = 0 then greatest(date_trunc('month', current_date)::date, current_date - 3)
       else (date_trunc('month', current_date) - make_interval(months => v.m) + interval '27 days')::date end,
  v.val, k.owner, v.note
from (values
('KRI-01', 5, 3.1::numeric, ''), ('KRI-01', 4, 3.8, ''), ('KRI-01', 3, 4.2, ''), ('KRI-01', 2, 6.5, 'August storms.'), ('KRI-01', 1, 9.1, ''), ('KRI-01', 0, 12.4, 'Backlog still clearing; see INC-108.'),
('KRI-02', 5, 7.2, ''), ('KRI-02', 4, 6.1, ''), ('KRI-02', 3, 5.4, ''), ('KRI-02', 2, 4.8, ''), ('KRI-02', 1, 4.9, ''), ('KRI-02', 0, 6.3, 'New invoice-themed lure.'),
('KRI-03', 5, 8, ''), ('KRI-03', 4, 11, ''), ('KRI-03', 3, 14, ''), ('KRI-03', 2, 16, ''), ('KRI-03', 1, 18, ''), ('KRI-03', 0, 19, 'Out-of-support platforms cannot be patched.'),
('KRI-04', 5, 99.92, ''), ('KRI-04', 4, 99.85, ''), ('KRI-04', 3, 99.95, ''), ('KRI-04', 2, 99.71, ''), ('KRI-04', 1, 99.64, ''), ('KRI-04', 0, 98.70, 'Hosting region degraded; see INC-111.'),
('KRI-05', 5, 1.8, ''), ('KRI-05', 4, 1.9, ''), ('KRI-05', 3, 2.2, ''), ('KRI-05', 2, 2.4, ''), ('KRI-05', 1, 2.1, ''), ('KRI-05', 0, 1.9, ''),
('KRI-06', 5, 6, ''), ('KRI-06', 4, 8, ''), ('KRI-06', 3, 7, ''), ('KRI-06', 2, 9, ''), ('KRI-06', 1, 11, ''), ('KRI-06', 0, 9, ''),
('KRI-07', 5, 1.82, ''), ('KRI-07', 4, 1.79, ''), ('KRI-07', 3, 1.75, ''), ('KRI-07', 2, 1.71, ''), ('KRI-07', 1, 1.68, ''), ('KRI-07', 0, 1.66, ''),
('KRI-08', 5, 15, ''), ('KRI-08', 4, 16, ''), ('KRI-08', 3, 19, ''), ('KRI-08', 2, 21, ''), ('KRI-08', 1, 22, ''), ('KRI-08', 0, 24, 'Exit interviews cite storm workload.'),
('KRI-09', 6, 1, ''), ('KRI-09', 5, 1, ''), ('KRI-09', 4, 2, ''), ('KRI-09', 3, 2, ''), ('KRI-09', 2, 2, ''),
('KRI-10', 6, 22, ''), ('KRI-10', 3, 41, ''), ('KRI-10', 0, 64, 'Two hail events this quarter.')
) v(ref, m, val, note) join key_risk_indicators k on k.reference = v.ref
on conflict do nothing;

-- ------------------------------------------------------------------ internal audit findings
insert into audit_findings (reference, audit, title, description, rating, owner, risk_id, control_id, raised_on, due_on, status, closed_on, evidence)
select v.ref, v.audit, v.title, v.descr, v.rating, v.owner, r.id, c.id, current_date + v.raised, current_date + v.due,
  case when v.closed is null then 'open' else 'closed' end, current_date + v.closed, v.evidence from (values
('AF-01', 'Claims payments review', 'Payment authority limits not enforced in the claims system', 'Seven of 40 sampled payments were approved above the approver''s limit.', 'high', 'Megan O''Rourke', 'R-06', 'C-09', -60, -15, null::int, ''),
('AF-02', 'Cyber resilience review', 'Privileged access reviews not evidenced for two quarters', '', 'medium', 'Nadia Haddad', 'R-10', 'C-15', -45, 30, null, ''),
('AF-03', 'CPS 230 readiness review', 'Material service provider register missing two providers', 'Two providers that support claims payments were not on the register.', 'high', 'Sarah Whitfield', 'R-16', null, -70, -5, null, ''),
('AF-04', 'CPS 230 readiness review', 'Claims call centre BCP not tested at the alternate site', '', 'medium', 'Sarah Whitfield', 'R-15', 'C-24', -70, 45, null, ''),
('AF-05', 'Risk management framework review', 'Review evidence not kept for a third of the register', '', 'low', 'Anita Raman', null, null, -100, -40, null, ''),
('AF-06', 'Reserving review', 'Reserving committee minutes not signed off', '', 'medium', 'Ben Castellano', 'R-03', 'C-05', -150, -60, -70, 'committee://2026/reserving-minutes-signed'),
('AF-07', 'Customer outcomes review', 'Vulnerable customer flags not visible to claims staff', '', 'high', 'Grace Liu', 'R-25', 'C-38', -30, 20, null, ''),
('AF-08', 'Cyber resilience review', 'Patch exceptions approved with no expiry date', '', 'medium', 'Liam Tran', 'R-13', 'C-21', -45, -2, null, '')
) v(ref, audit, title, descr, rating, owner, risk, ctl, raised, due, closed, evidence)
left join risks r on r.reference = v.risk left join controls c on c.risk_id = r.id and c.reference = v.ctl
on conflict do nothing;

-- ------------------------------------------------------------------ recent history
insert into activity (record_kind, record_ref, actor, action, note, created_at)
select v.k, v.r, v.a, v.act, v.n, now() - v.ago from (values
  ('risk', 'R-01', 'James Kovac', 'review-risk', 'Likelihood raised after the catastrophe model refresh', interval '40 days'),
  ('risk', 'R-01', 'James Kovac', 'note', 'Broker quotes for the extra layer requested', interval '6 days'),
  ('risk', 'R-08', 'Megan O''Rourke', 'note', 'Second partner call centre in contract negotiation', interval '12 days'),
  ('risk', 'R-09', 'Megan O''Rourke', 'review-risk', 'Backlog after the August storms', interval '10 days'),
  ('risk', 'R-10', 'Nadia Haddad', 'note', 'Network segmentation design approved', interval '9 days'),
  ('risk', 'R-12', 'Nadia Haddad', 'note', 'Linked INC-107 broker portal access', interval '8 days'),
  ('risk', 'R-06', 'Mark Delaney', 'test-control', 'C-09 ineffective in the payments sample', interval '40 days'),
  ('incident', 'INC-107', 'Nadia Haddad', 'log-incident', 'Unauthorised access to the broker portal', interval '9 days'),
  ('incident', 'INC-107', 'Priyanka Desai', 'update-incident', 'APRA notified 40 hours after awareness', interval '7 days'),
  ('incident', 'INC-111', 'Liam Tran', 'log-incident', 'Hosting region degraded, claims lodgement down', interval '10 hours'),
  ('obligation', 'OB-20', 'Megan O''Rourke', 'attest', 'breach', interval '15 days'),
  ('indicator', 'KRI-04', 'Liam Tran', 'record-reading', '98.7 this month: red', interval '1 day')
) v(k, r, a, act, n, ago)
where not exists (select 1 from activity);

# The Protecht demo, answered

Captured 2026-10-23 06:48 UTC by `node scripts/demo-check.mjs --capture` against a fresh load of the demo insurer (`npm run demo:insurer`). Every answer below is asserted by `npm test`. Dates move with the day you run it; the shape of the answer does not.

In a session Claude reads this output and answers in plain language. The output is what the answer is built from.

## 1. "The claims payment run to Norvale failed today, about 900 payments did not go out. We knew at 14:48 Sydney time. Daniel says the impact is material."

Claude runs `npm run risk -- log-incident --reference=INC-116 "--title=Claims payment run failed, 900 payments not sent" "--aware=2026-10-23 14:48+11:00" --severity=major "--owner=Daniel Okafor" --risk=R-18 --operation=OP-3 --material-impact=true "--description=The daily claim payment file was rejected by Norvale Payments. About 900 claim payments were not made." "--actor=Anita Raman"`

```text
reference: INC-116
title: Claims payment run failed, 900 payments not sent
description: The daily claim payment file was rejected by Norvale Payments. About 900 claim payments were not made.
kind: incident
severity: major
owner: Daniel Okafor
aware_at: 2026-10-23 03:48 UTC
material_impact: true
outside_tolerance: false
privacy_breach: false
status: open
```

## 1b. "What clocks did that start?"

Claude runs `npm run risk -- incidents`

```text
  reference  title                                             kind      severity  owner           days_open  risk  critical_operation  apra_24h_due      apra_72h_due      ndb_assess_by  privacy  privacy_notifiable  open_actions
  ---------  ------------------------------------------------  --------  --------  --------------  ---------  ----  ------------------  ----------------  ----------------  -------------  -------  ------------------  ------------
  INC-111    Hosting region degraded, claims lodgement dow...  incident  major     Liam Tran       1          R-16  OP-2                2026-10-23 20:48  2026-10-25 20:48                                              1           
  INC-116    Claims payment run failed, 900 payments not sent  incident  major     Daniel Okafor   0          R-18  OP-3                                  2026-10-26 03:48                                              0           
  INC-107    Unauthorised access to the broker portal usin...  incident  severe    Nadia Haddad    9          R-12                                                          2026-11-13     AU                           1           
  INC-115    Contractor injured at a storm-damaged property    incident  moderate  Tom Hughes      45         R-34                                                                                                      1           
  INC-104    Duplicate claim payments after a payment file...  incident  moderate  Daniel Okafor   40         R-06  OP-3                                                                                                1           
  INC-112    Claim decline for a customer in hardship esca...  incident  moderate  Grace Liu       35         R-25                                                                                                      1           
  INC-106    Renewal batch failed and 3,400 renewal notice...  incident  moderate  Liam Tran       25         R-11  OP-1                                                                                                0           
  INC-108    Claims lodgement backlog breached Code timefr...  incident  major     Megan O'Rourke  18         R-09  OP-2                                                                                                1           
  INC-114    Wrong premium on 1,200 home renewals after a ...  incident  major     James Kovac     14               OP-1                                                                                                1           
```

## 2. "Which control tests are overdue?"

Claude runs `npm run risk -- controls-due --days=0`

```text
  risk  reference  title                                             owner            effectiveness        last_tested_on  next_test_on  days_left
  ----  ---------  ------------------------------------------------  ---------------  -------------------  --------------  ------------  ---------
  R-08  C-13       Catastrophe surge staffing plan with partner ...  Megan O'Rourke   partially-effective  2025-09-18      2026-09-18    -35      
  R-05  C-08       Postcode accumulation limits in the rating en...  James Kovac      partially-effective  2026-03-27      2026-09-23    -30      
  R-32  C-48       Broker premium ageing and suspension              Daniel Okafor    partially-effective  2026-06-25      2026-09-23    -30      
  R-13  C-21       Monthly patch compliance reporting                Liam Tran        ineffective          2026-09-03      2026-10-03    -20      
  R-09  C-14       Daily claims ageing report against Code timef...  Megan O'Rourke   ineffective          2026-09-08      2026-10-08    -15      
  R-02  C-03       Monthly pricing adequacy review against loss ...  James Kovac      partially-effective  2026-07-15      2026-10-13    -10      
  R-22  C-33       Regulatory reporting calendar with sign-off       Daniel Okafor    effective            2026-07-15      2026-10-13    -10      
  R-36  C-53       Work-from-home capability tested quarterly        Sarah Whitfield  effective            2026-07-20      2026-10-18    -5       
  R-03  C-06       Independent peer review of reserving assumptions  Ben Castellano   not-tested                           2026-10-23    0        
  R-14  C-22       Migration go/no-go checklist with rollback plan   Liam Tran        not-tested                           2026-10-23    0        
  R-16  C-26       Cloud exit plan                                   Liam Tran        not-tested                           2026-10-23    0        
  R-26  C-40       Renewal pricing fairness review                   Grace Liu        not-tested                           2026-10-23    0        
```

## 3. "Which indicators breached this month?"

Claude runs `npm run risk -- indicator-breaches`

```text
  reference  name                                          owner           risk  measured_on  value  unit     amber  red  status
  ---------  --------------------------------------------  --------------  ----  -----------  -----  -------  -----  ---  ------
  KRI-01     Claims outside Code timeframes                Megan O'Rourke  R-09  2026-10-20   12.4   %        5      10   red   
  KRI-03     Critical patches overdue more than 30 days    Liam Tran       R-13  2026-10-20   19     patches  5      15   red   
  KRI-04     Claims lodgement availability                 Liam Tran       R-16  2026-10-20   98.7   %        99.5   99   red   
  KRI-02     Phishing simulation click rate                Nadia Haddad    R-10  2026-10-20   6.3    %        5      10   amber 
  KRI-08     Claims staff turnover                         Tom Hughes      R-33  2026-10-20   24     %        18     25   amber 
  KRI-10     Catastrophe reinsurance limit used this year  James Kovac     R-01  2026-10-20   64     %        60     80   amber 
```

## 4. "Where are our CPS 230 gaps?"

Claude runs `npm run risk -- cps230-gaps`

```text
summary: 4 of 5 critical operations and 4 of 8 material providers have a gap; 3 findings need action now
operations
  reference  name                           owner            max_outage_hours  max_data_loss_hours  min_service_level                                 last_exercise_on  bcp_reviewed_on  material_providers  outside_tolerance_12m  gaps                                            
  ---------  -----------------------------  ---------------  ----------------  -------------------  ------------------------------------------------  ----------------  ---------------  ------------------  ---------------------  ------------------------------------------------
  OP-1       Policy servicing and renewals  Sarah Whitfield  48                4                    Renewals issued and policy changes made withi...  2026-04-06        2026-04-06       2                   0                      none                                            
  OP-2       Claims lodgement               Megan O'Rourke   4                 1                    Claims lodged by phone or online, calls answe...  2025-09-18        2025-12-27       2                   2                      exercise over a year old; disruption outside ...
  OP-3       Claims payments                Daniel Okafor    24                0.5                  Emergency and hardship payments made the same...  2026-05-26        2025-10-08       2                   0                      BCP review over a year old                      
  OP-4       Catastrophe response           Megan O'Rourke   12                                     Assessors on site within 72 hours of a declar...                    2026-07-15       2                   0                      tolerance levels incomplete; never exercised    
  OP-5       New business and quotes        James Kovac      72                24                                                                     2026-07-25        2026-07-25       0                   0                      tolerance levels incomplete                     
providers
  reference  name                         service                                           operation  agreement_changed_on  regulator_notified_on  last_reviewed_on  gaps                                         
  ---------  ---------------------------  ------------------------------------------------  ---------  --------------------  ---------------------  ----------------  ---------------------------------------------
  SP-01      Corvane Cloud Services       Hosting for the policy and claims platforms       OP-1       2026-10-11                                   2026-07-15        APRA not yet notified of the agreement change
  SP-02      Arkwell Policy Systems       Policy administration software as a service       OP-1                                                    2025-08-29        review over a year old                       
  SP-03      Fenmoor Contact Centres      Outsourced claims call centre                     OP-2       2026-09-08                                   2026-05-26        APRA not yet notified of the agreement change
  SP-04      Norvale Payments             Claim payment file processing                     OP-3       2025-12-27            2026-01-06             2026-04-06        none                                         
  SP-05      Pemberly Claims Assist       After-hours claims triage line                    OP-2                                                    2026-05-26        none                                         
  SP-06      Tarrant Loss Adjusters       Loss adjusting panel for large and catastroph...  OP-4                                                    2025-10-08        review over a year old                       
  SP-07      Quillon Data Backup          Offsite immutable backups                         OP-3                                                    2026-08-24        none                                         
  SP-08      Brackenridge Building Panel  Builder network for home claims                   OP-4                                                    2026-07-25        none                                         
findings
  severity  reference    rule                    finding                                         
  --------  -----------  ----------------------  ------------------------------------------------
  1         OP-2         CPS230-43               Last exercise 2025-09-18, over a year ago       
  1         OP-4         CPS230-43               No business continuity exercise recorded        
  1         SP-03        CPS230-59               Breached: APRA notice was due 2026-10-06        
  2         INC-111      CPS230-33               Notify APRA by 2026-10-25 20:48 UTC             
  2         INC-116      CPS230-33               Notify APRA by 2026-10-26 03:48 UTC             
  2         OP-4         CPS230-38               Set the missing tolerance levels: maximum dat...
  2         OP-5         CPS230-38               Set the missing tolerance levels: minimum ser...
  2         INC-111      CPS230-42               Notify APRA by 2026-10-23 20:48 UTC             
  2         OP-3         CPS230-45               BCP last reviewed 2025-10-08                    
  2         SP-01        CPS230-59               Notify APRA by 2026-11-06                       
  2         SP-02        POLICY-PROVIDER-REVIEW  Material provider last reviewed 2025-08-29, o...
  2         SP-06        POLICY-PROVIDER-REVIEW  Material provider last reviewed 2025-10-08, o...
  3         INC-114      CPS230-32               Link the incident to the risk it touches        
  2         12 controls  CPS230-30               4 never tested, 8 overdue: see controls-due     
```

## 5. "Write the quarterly board risk report."

Claude runs `npm run risk -- board-report`

```text
file: drafts/board-report-2026-10-23-c03038f3.html
period: 2026-07-25 to 2026-10-23
open_risks: 40
over_appetite: 9
red_indicators: 3
incidents: 14
findings_needing_action: 12
```

## 6. "Our marine and travel book is still in Protecht. Here is the risk register export: try it first."

Claude runs `npm run risk -- import protecht-risks --file=fixtures/protecht-risks.csv "--actor=Anita Raman" --dry-run`

```text
added: 6
unchanged: 0
residual_defaulted_to_inherent: 1
dry_run: true
```

## 6b. "Looks right. Import it."

Claude runs `npm run risk -- import protecht-risks --file=fixtures/protecht-risks.csv "--actor=Anita Raman"`

```text
added: 6
unchanged: 0
residual_defaulted_to_inherent: 1
dry_run: false
```

## 6c. "Now the incident register. The times in it are Sydney winter time."

Claude runs `npm run risk -- import protecht-incidents --file=fixtures/protecht-incidents.csv --offset=+10:00 "--actor=Anita Raman"`

```text
added: 5
unchanged: 0
open: 2
closed: 3
linked_to_a_risk: 5
times_read_as: UTC+10:00
dry_run: false
```

## 6d. "What still needs a person after the import?"

Claude runs `npm run risk -- compliance`

```text
  severity  kind        reference  rule                    finding                                         
  --------  ----------  ---------  ----------------------  ------------------------------------------------
  3         risk        RSK-1001   POLICY-IMPORT           Imported draft: confirm the ratings and owner...
  3         risk        RSK-1002   POLICY-IMPORT           Imported draft: confirm the ratings and owner...
  3         risk        RSK-1003   POLICY-IMPORT           Imported draft: confirm the ratings and owner...
  3         risk        RSK-1004   POLICY-IMPORT           Imported draft: confirm the ratings and owner...
  3         risk        RSK-1005   POLICY-IMPORT           Imported draft: confirm the ratings and owner...
  3         risk        RSK-1006   POLICY-IMPORT           Imported draft: confirm the ratings and owner...
  ... (the other findings are the same as before the import)
```

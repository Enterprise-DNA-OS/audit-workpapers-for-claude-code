# Command reference

Run from the project root. Replace fictional examples with verified records. Every command accepts --json. Writes require --actor="Name" and accept --dry-run. Actor labels record attribution; they are not authentication.

## engagements

Read progress, dates and unresolved counts for each engagement.

```bash
npm run audit -- engagements
```

## workpapers

Read procedure, evidence, preparation and review records.

```bash
npm run audit -- workpapers
```

## requests

Read client requests including received, accepted and waived items.

```bash
npm run audit -- requests
```

## review-notes

Read the review points and their recorded resolutions.

```bash
npm run audit -- review-notes
```

## review-queue

Find unfinished workpapers and their open points.

```bash
npm run audit -- review-queue
```

## request-chase

Find outstanding evidence and the person responsible.

```bash
npm run audit -- request-chase
```

## assembly-due

Check reported engagements and file assembly dates.

```bash
npm run audit -- assembly-due
```

## compliance

Show missing documentation fields and date prompts. Never call this a compliance certificate.

```bash
npm run audit -- compliance
```

## activity

Read before and after records and the operator attribution.

```bash
npm run audit -- activity
```

## imports

Check import fingerprints, batches and counts.

```bash
npm run audit -- imports
```

## attention

Read overdue work, missing client evidence, open review points and late assembly.

```bash
npm run audit -- attention
```

## insights

Run ten cross-record questions. Describe only what the records establish.

```bash
npm run audit -- insights
```

## weekly-review

Read engagement progress, review queue and request chase. Write the Monday brief with an owner and next action for each exception.

```bash
npm run audit -- weekly-review
```

## history

Read the full engagement, workpapers, requests, review points, notes and activity before giving advice about its records.

```bash
npm run audit -- history HBR26
```

## add-engagement

Register a real engagement only from operator-supplied details. Confirm the applicable standard separately.

```bash
npm run audit -- add-engagement --code=DEMO26 --name="Fictional annual audit" --client="Fictional Ltd" --partner="Reviewer" --period-end=2026-03-31 --due=2026-12-01 --jurisdiction=NZ --actor="Operator"
```

## add-workpaper

Plan the firm-approved procedure. Do not generate or copy licensed audit methodology.

```bash
npm run audit -- add-workpaper --engagement=HBR26 --code=C200 --name="Bank reconciliation" --owner="Preparer" --assertion=Completeness --risk=high --due=2026-12-01 --actor="Operator"
```

## add-request

Record an evidence request. This does not send it.

```bash
npm run audit -- add-request --engagement=HBR26 --code=R03 --name="Bank reconciliation" --owner="Finance lead" --due=2026-12-01 --actor="Operator"
```

## receive-request

Record a reference to evidence actually received. The file remains in the firm-controlled document store.

```bash
npm run audit -- receive-request HBR26/R01 --evidence="evidence://protected-store/document" --actor="Operator"
```

## decide-request

Record the human decision. Acceptance requires received evidence. A waiver requires a reason and is not an audit conclusion.

```bash
npm run audit -- decide-request HBR26/R01 --decision=accepted --reason="Matched the requested period" --actor="Operator"
```

## prepare

Record completed work and the preparer's own conclusion. Never claim to have performed an audit procedure.

```bash
npm run audit -- prepare HBR26/C100 --evidence="evidence://protected-store/document" --procedure="Work actually performed" --conclusion="Human preparer conclusion" --actor="Operator"
```

## review

Record a qualified reviewer's decision using their actor label. The preparer cannot also review under this workspace policy. Do not invent a sign-off.

```bash
npm run audit -- review HBR26/C100 --extent="Evidence and procedure actually reviewed" --actor="Operator"
```

## revise

Reopen a workpaper. Prior preparation and review remain in activity history; current sign-offs are cleared.

```bash
npm run audit -- revise HBR26/C100 --reason="Additional evidence received" --actor="Operator"
```

## add-review-note

Raise a review point on an unfinished workpaper. Revise a reviewed workpaper first.

```bash
npm run audit -- add-review-note HBR26/I200 --name="Explain reconciliation difference" --owner="Preparer" --due=2026-12-01 --severity=significant --actor="Operator"
```

## resolve-note

Record the actual resolution. Every open point blocks workpaper review and file assembly.

```bash
npm run audit -- resolve-note "Explain count difference" --resolution="Documented resolution supplied by reviewer" --actor="Operator"
```

## record-report

Record dates from an already issued report and the firm's retention policy. Never issue an opinion or assume these example dates apply.

```bash
npm run audit -- record-report HBR26 --report-date=2026-11-18 --assembly-due=2027-01-17 --retention-until=2034-11-18 --standard="Firm confirmed applicable standard" --actor="Operator"
```

## assemble

Record file assembly only after the firm approves it. Requires reviewed workpapers, decided requests, no open points and complete policy dates. Locks further edits.

```bash
npm run audit -- assemble HBR26 --actor="Operator"
```

## reopen

Record a firm-authorised reopening with the precise reason. Complete and review affected work before assembling again.

```bash
npm run audit -- reopen HBR26 --reason="Partner approved post-assembly change" --actor="Operator"
```

## log

Record a significant discussion or operational note. Include who, when and what from actual evidence.

```bash
npm run audit -- log HBR26 --text="Operator supplied discussion note" --actor="Operator"
```

## import

Read docs/replace-auditfile.md. Preview and reconcile the mapped exports before repeating without --dry-run. Fixtures are synthetic, not an official vendor export.

```bash
npm run audit -- import auditfile ./examples/auditfile --mapping=./examples/auditfile-map.json --batch=demo-import --dry-run --actor="Operator"
```

## export

Export every business record, import receipt and activity entry. An existing file is never overwritten.

```bash
npm run audit -- export --out=./exports/engagements.json
```

## draft-requests

Write a branded request list into drafts/. Read its contents, check recipients and dates, and hand it to the operator. Never send it.

```bash
npm run audit -- draft-requests HBR26
```


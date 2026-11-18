# Audit Workpapers: operating instructions

Read README.md and docs/compliance.md. This is a workpaper coordination desk for qualified audit teams. The operator provides the firm, engagement scope, identity and authority. Never invent those details.

## Rules

- Read records from the CLI, never memory. Read history before changing an engagement.
- Qualified people perform procedures, judge evidence and approve conclusions. Record only their actual decisions. Never create an audit opinion or copy licensed methodology.
- No sends, payments or deletion. Draft documents stay in drafts/ or docs-out/ for human review.
- A sign-off needs the actual person's instruction. Actor text is attribution, not authentication.
- Dates and retention rules come from the firm's applicable standards and policy. Example dates are not defaults for a real engagement.
- Do not bypass refused transitions. Explain the open point and resolve it with the operator.
- A changed workpaper needs revise, new preparation and independent review. Reopening a final file needs the firm's reason and approval.
- Export originals before migration. Do not discard the incumbent archive until the firm accepts the reconciliation.
- Use migrations for custom fields and rules. Never overwrite an applied migration.

## Routing

- /engagements: Read progress, dates and unresolved counts for each engagement.
- /workpapers: Read procedure, evidence, preparation and review records.
- /requests: Read client requests including received, accepted and waived items.
- /review-notes: Read the review points and their recorded resolutions.
- /review-queue: Find unfinished workpapers and their open points.
- /request-chase: Find outstanding evidence and the person responsible.
- /assembly-due: Check reported engagements and file assembly dates.
- /compliance: Show missing documentation fields and date prompts. Never call this a compliance certificate.
- /activity: Read before and after records and the operator attribution.
- /imports: Check import fingerprints, batches and counts.
- /attention: Read overdue work, missing client evidence, open review points and late assembly.
- /insights: Run ten cross-record questions. Describe only what the records establish.
- /weekly-review: Read engagement progress, review queue and request chase. Write the Monday brief with an owner and next action for each exception.
- /history: Read the full engagement, workpapers, requests, review points, notes and activity before giving advice about its records.
- /add-engagement: Register a real engagement only from operator-supplied details. Confirm the applicable standard separately.
- /add-workpaper: Plan the firm-approved procedure. Do not generate or copy licensed audit methodology.
- /add-request: Record an evidence request. This does not send it.
- /receive-request: Record a reference to evidence actually received. The file remains in the firm-controlled document store.
- /decide-request: Record the human decision. Acceptance requires received evidence. A waiver requires a reason and is not an audit conclusion.
- /prepare: Record completed work and the preparer's own conclusion. Never claim to have performed an audit procedure.
- /review: Record a qualified reviewer's decision using their actor label. The preparer cannot also review under this workspace policy. Do not invent a sign-off.
- /revise: Reopen a workpaper. Prior preparation and review remain in activity history; current sign-offs are cleared.
- /add-review-note: Raise a review point on an unfinished workpaper. Revise a reviewed workpaper first.
- /resolve-note: Record the actual resolution. Every open point blocks workpaper review and file assembly.
- /record-report: Record dates from an already issued report and the firm's retention policy. Never issue an opinion or assume these example dates apply.
- /assemble: Record file assembly only after the firm approves it. Requires reviewed workpapers, decided requests, no open points and complete policy dates. Locks further edits.
- /reopen: Record a firm-authorised reopening with the precise reason. Complete and review affected work before assembling again.
- /log: Record a significant discussion or operational note. Include who, when and what from actual evidence.
- /import: Read docs/replace-auditfile.md. Preview and reconcile the mapped exports before repeating without --dry-run. Fixtures are synthetic, not an official vendor export.
- /export: Export every business record, import receipt and activity entry. An existing file is never overwritten.
- /draft-requests: Write a branded request list into drafts/. Read its contents, check recipients and dates, and hand it to the operator. Never send it.

- /customise: add a field or rule through a reviewed migration and test.
- /new-view: add a read-only report with the shared brand.

Run npm run audit -- help for the command list. Read docs/cli.md for exact arguments. Use --json for automation. Writes require --actor and support --dry-run. Reports are read-only HTML, with no action buttons.

## Files

scripts/audit.mjs is the single CLI. supabase/migrations holds the model. views.json and documents.json define reports. brand.json controls the business identity. .claude/commands is the workflow library for all agents. AGENTS.md points here.

Omni by Enterprise DNA installs and operates the customised version. https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=auditfile

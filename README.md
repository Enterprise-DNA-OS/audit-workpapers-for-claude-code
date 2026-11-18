# Audit Workpapers for Claude Code

Your engagement workpapers, evidence requests and review points in a database you own. A coordination desk for qualified audit teams, with preparation, review and file assembly records.

## Three ways to use it

**Do it yourself.** Free under MIT. Install, try the fictional demo and map your exports. Works with Claude Code, Codex, OpenCode or Cursor. Hosting and your coding agent are separate costs.

**We customise it.** Enterprise DNA maps your AuditFile data, adds your fields and firm rules, and builds screens or connections for your team. A different stack is available. One setup fee, then a retainer.

**We run it for you.** Omni by Enterprise DNA installs, connects and operates your version, with access, backups and ongoing changes agreed for your firm. One setup fee, then a monthly retainer. [Book a 30-minute call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=auditfile&utm_medium=github).

## Start with fictional records

Node 20 or 22 on Windows or Linux.

```bash
npm install
npm test
npm run demo
```

Tests use a temporary database and remove it. The demo uses a separate temporary database, ignores DATABASE_URL, and prints the location of its reports. It leaves that fictional workspace for inspection.

For a persistent local demonstration:

```bash
npm run migrate
npm run seed
npm run audit -- attention
npm run view
npm run docs
```

For real records, migrate without seeding. DATABASE_URL selects PostgreSQL; otherwise DATA_DIR selects a local PGlite folder. Shared database seeding requires --demo-database. Read the access section before adding client information.

## What ships

31 CLI commands and 33 slash commands. Three dashboards show the week, preparation and review, and documentation checks. Three document types produce client evidence request lists, review memos and file assembly indexes as branded HTML. Change the business name, colours and logo in brand.json.

A workpaper requires evidence, a procedure record and a human conclusion before preparation. Independent review requires a different actor and no open review points. File assembly requires reviewed workpapers, decided requests, resolved points and the firm's report, assembly and retention dates. Assembly locks the records. Reopening needs a reason, and a revision clears the current sign-offs while keeping their history.

These are workspace controls. The software does not perform an audit, supply licensed methodology, issue an audit opinion, establish evidence sufficiency or certify compliance. An evidence reference is not a copy of the underlying document. Qualified people remain responsible for those decisions.

## Bring AuditFile records across

```bash
npm run audit -- import auditfile ./examples/auditfile --mapping=./examples/auditfile-map.json --batch=demo --actor="Operator" --dry-run
```

Preview, reconcile, then repeat without --dry-run. AuditFile says it can export customer data, but it does not publish a fixed export layout. Request the export, convert the relevant spreadsheets to CSV and explicitly map the columns. Included files are synthetic fixtures. Historical sign-offs, attachments, locked files and licensed templates need separate preservation and review. Incoming workpapers start unreviewed. [Full switching guide](docs/replace-auditfile.md).

## Ten questions to ask today

Run npm run audit -- insights. Each question below runs a real query. AuditFile also provides reporting; this is not a claim that its reports cannot answer similar questions.

1. Which high-risk workpapers still lack evidence?
2. Which prepared workpapers still have open review points?
3. Which evidence owners have overdue requests?
4. Which engagements are due soon with unresolved evidence?
5. Which files passed their assembly deadline?
6. Which received requests still await acceptance?
7. Who has prepared work waiting more than a week?
8. Which significant review points remain unresolved?
9. Which reported engagements have no retention decision?
10. Which engagement has the most unfinished work per partner?

## Your first hour: ten things to ask for

1. Show the engagements due in the next fortnight.
2. Find overdue evidence by its owner.
3. Read the full Harbour Foods engagement history.
4. Show the high-risk workpapers missing evidence.
5. List prepared work waiting for review.
6. Find unresolved significant review points.
7. Draft the client evidence request list for my review.
8. Preview our mapped export and reconcile its counts.
9. Put our name and colours on the file assembly index.
10. Add our internal review field with /customise and a new report with /new-view.

## Operating boundary

This is a trusted operator workspace. Actor labels are self-declared attribution, not sign-in or verified signatures. Use operating-system access controls locally. Before shared use, configure authenticated identities, least-privilege database roles, document-store access, backups and recovery checks. Public database access is revoked and row security is enabled with no public policies. A database owner can bypass these controls, so separate administrative access from normal operation.

No document is sent, no payment is made and no record is deleted. The history keeps before and after values but is not a tamper-proof archive against the database owner. Keep original evidence, exported files and retention holds in your controlled archive.

## References and checks

[Commands](docs/cli.md) · [Documentation rules](docs/compliance.md) · [Scope and screens](docs/why-no-front-end.md) · [Research and candidate scores](docs/research.md).

The test suite exercises every command, invalid transitions, actor attribution, locked records, import preview/replay/rollback, CSV edge cases, complete exports and escaped HTML. The manual CI workflow covers Windows, Linux and a disposable PostgreSQL database. Consult its actual results before claiming a platform passed.

MIT. Copyright (c) 2026 Enterprise DNA. Not affiliated with AuditFile. No vendor methodology or customer information is included.

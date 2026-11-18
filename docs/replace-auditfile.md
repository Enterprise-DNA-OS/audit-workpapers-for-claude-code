# Move workpaper coordination from AuditFile

## Get an export before cancelling

[AuditFile's pricing FAQ](https://auditfile.com/pricing), checked 18 November 2026, confirms that customers can take their created and uploaded data. It does not specify one universal export layout or promise a one-click CSV download. Request your export through AuditFile and preserve the original files, attachments and final engagement archive.

[AuditFile's feature notes](https://marketing.auditfile.com/new-features) describe workpaper status tracking and document export. A combined PDF is useful as an archive, not a structured import into this desk.

## Map three spreadsheets

Save the engagement, workpaper and request lists as UTF-8 CSV. Name them engagements.csv, workpapers.csv and requests.csv in a protected local import folder. All three are required and each must contain at least one row. Use a deliberate pilot containing those record types. See examples/auditfile-map.json for the field mapping, where each canonical field names an exact source heading. Headers are matched without case sensitivity; every mapped heading must exist.

- engagements: code, name, client, partner, period_end, due_date, jurisdiction; optional standard_version.
- workpapers: engagement (the engagement code), code, name, owner, assertion, risk, due_date; optional evidence_ref.
- requests: engagement, code, name, owner, due_date; optional evidence_ref.

Dates use YYYY-MM-DD. Risk is low, medium or high. Jurisdiction is NZ, AU or OTHER. Engagement codes must be unique. Each workpaper and request code is unique within its engagement. Empty required values, bad dates and unknown parents fail the whole batch. Source fields not mapped are not imported; preserve them in the original export.

Included fixtures are hand-authored fictional data demonstrating the import contract. They are not a verified AuditFile export layout. Adapt the map to your real headers and reconcile the result with the firm before migration.

## Preview and load

```bash
npm run audit -- import auditfile ./imports/pilot --mapping=./imports/pilot-map.json --batch=pilot --actor="Migration owner" --dry-run
```

The preview validates and executes the complete transaction, then rolls it back. Check counts and sample records before repeating without --dry-run. The full-file fingerprint makes an identical replay safe. Changing a batch's content is refused. Existing record code collisions are refused rather than silently overwriting work. A later incremental export needs a new batch and only new records; update existing records through the normal workflow or a reviewed migration.

## Reconcile before switching

Check engagement counts, workpaper counts by engagement, request counts, owners, dates and evidence references. Open a sample of the original documents in the protected store. Incoming workpapers and requests start open, even when a reference is supplied. Historic sign-offs are not imported as current approvals.

Attachments, signed opinions, methodology, trial balances, prior activity, historical review states, licensed templates and final-file locks remain in the incumbent archive until an explicit migration handles them. This tool covers workpaper coordination, not the full audit suite. Run both during a pilot and let the engagement partner accept the record reconciliation before changing the firm's process.

## Keep your data portable

```bash
npm run audit -- export --out=./exports/desk-backup.json
```

This export contains every business record, notes, import receipts and activity entry. It does not contain the external evidence files. An existing output file is refused. Protect both the database backup and document archive, and test recovery before shared production use.

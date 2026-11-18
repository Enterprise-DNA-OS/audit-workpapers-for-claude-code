# export

Export every business record, import receipt and activity entry. An existing file is never overwritten.

```bash
npm run audit -- export --out=./exports/engagements.json
```

Read the full engagement with history first when changing a record. Names and partial ids work, and ambiguity lists candidates. Stop on errors. Report the resulting record and any unresolved work. Never infer an audit opinion, send a message, or sign for someone without their recorded instruction.

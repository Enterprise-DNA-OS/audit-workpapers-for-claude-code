# add-engagement

Register a real engagement only from operator-supplied details. Confirm the applicable standard separately.

```bash
npm run audit -- add-engagement --code=DEMO26 --name="Fictional annual audit" --client="Fictional Ltd" --partner="Reviewer" --period-end=2026-03-31 --due=2026-12-01 --jurisdiction=NZ --actor="Operator"
```

Read the full engagement with history first when changing a record. Names and partial ids work, and ambiguity lists candidates. Stop on errors. Report the resulting record and any unresolved work. Never infer an audit opinion, send a message, or sign for someone without their recorded instruction.

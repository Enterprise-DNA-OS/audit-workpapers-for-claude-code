import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';import {migrate} from './migrate.mjs';import {seed} from './seed.mjs';import {run,human} from './audit.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'audit-workpapers-demo-'));process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(dir,'db');process.env.OUTPUT_DIR=dir;
const db=await getDb();try{await migrate(db);await seed(db);for(const c of ['engagements','request-chase','review-queue'])console.log(`\n${c}\n${human(await run(db,[c]))}`);}finally{await db.close();}
for(const c of ['view','docs']){const p=spawnSync(process.execPath,[`scripts/${c}.mjs`],{cwd:REPO_ROOT,env:process.env,stdio:'inherit'});if(p.status!==0)throw Error(`${c} failed`);}
console.log(`Fictional demo, no production database used. Reports and disposable database: ${dir}`);

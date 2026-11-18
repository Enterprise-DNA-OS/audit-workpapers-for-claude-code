#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
import {page,table as htmlTable,writeOut} from './lib/render.mjs';

export const commands={
 engagements:'List engagement progress',workpapers:'List workpaper records',requests:'List client evidence requests','review-notes':'List review notes',
 'review-queue':'Review unfinished workpapers','request-chase':'Chase outstanding evidence','assembly-due':'Review file assembly dates',compliance:'Check documentation fields',activity:'Read operator history',imports:'Read import receipts',attention:'See overdue and unresolved work',insights:'Answer ten engagement questions','weekly-review':'Prepare the Monday review',history:'Read one engagement and its records',
 'add-engagement':'Register an engagement','add-workpaper':'Plan a workpaper','add-request':'Request client evidence','receive-request':'Record received evidence','decide-request':'Accept or waive a request',prepare:'Record completed preparation',review:'Record independent review',revise:'Reopen a workpaper with a reason','add-review-note':'Raise a review point','resolve-note':'Record a review point resolution','record-report':'Record an externally issued report and dates',assemble:'Lock a complete file',reopen:'Reopen an assembled file with a reason',log:'Record an engagement note',import:'Import mapped AuditFile exports',export:'Export all business records','draft-requests':'Write a private evidence request draft'
};
const readSql={
 engagements:'select * from engagement_progress order by due_date,code',workpapers:'select e.code engagement,w.* from workpapers w join engagements e on e.id=w.engagement_id order by e.code,w.code',requests:'select e.code engagement,r.* from requests r join engagements e on e.id=r.engagement_id order by e.code,r.code','review-notes':'select e.code engagement,n.* from review_notes n join engagements e on e.id=n.engagement_id order by n.due_date',
 'review-queue':'select * from review_queue order by due_date,engagement,code','request-chase':'select * from request_chase order by due_date,engagement,code','assembly-due':"select code,name,report_date,assembly_due,retention_until,status from engagements where report_date is not null order by assembly_due nulls first",compliance:'select * from documentation_checks order by reference,rule',activity:'select * from activity order by created_at,id',imports:'select * from import_batches order by created_at,id'
};
const tables=['engagements','workpapers','requests','review_notes','notes','import_batches','activity'];
const writes=new Set(['add-engagement','add-workpaper','add-request','receive-request','decide-request','prepare','review','revise','add-review-note','resolve-note','record-report','assemble','reopen','log','import']);
const specs={
 'add-engagement':['code','name','client','partner','period-end','due','jurisdiction','standard'],
 'add-workpaper':['engagement','code','name','owner','assertion','risk','due'],
 'add-request':['engagement','code','name','owner','due'],
 'receive-request':['evidence'], 'decide-request':['decision','reason'],prepare:['evidence','procedure','conclusion'],review:['extent'],revise:['reason'],
 'add-review-note':['name','owner','due','severity'], 'resolve-note':['resolution'], 'record-report':['report-date','assembly-due','retention-until','standard'],assemble:[],reopen:['reason'],log:['text'],import:['mapping','batch'],export:['out'],'draft-requests':[]
};
const required=(o,k)=>{const v=typeof o[k]==='string'?o[k].trim():'';if(!v)throw Error(`Missing --${k}=value`);return v;};
const date=(s)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`Invalid calendar date: ${s}`);return s;};
const choice=(s,values)=>{if(!values.includes(s))throw Error(`Expected ${values.join('|')}, got ${s}`);return s;};
export function parseArgs(argv){const opts={},pos=[];for(const a of argv){if(a.startsWith('--')){const at=a.indexOf('=');const key=a.slice(2,at<0?undefined:at);if(Object.hasOwn(opts,key))throw Error(`Repeated option --${key}`);opts[key]=at<0?true:a.slice(at+1);}else pos.push(a);}return {cmd:pos.shift()||'help',pos,opts};}
async function resolve(db,t,term){
 if(!term)throw Error('Supply an id, code or name');
 const rows=await db.query(t==='engagements'?`select id,code,name from engagements order by code`:(t==='workpapers'||t==='requests')?`select x.id,e.code||'/'||x.code code,x.name from ${t} x join engagements e on e.id=x.engagement_id order by e.code,x.code`:`select id,id::text code,name from ${t} order by name`);
 const q=String(term).toLowerCase();const exact=rows.filter(x=>x.id===q||x.code.toLowerCase()===q);
 const hits=exact.length?exact:rows.filter(x=>x.id.startsWith(q)||x.name.toLowerCase().includes(q)||x.code.toLowerCase().includes(q));
 if(hits.length!==1){const e=Error(hits.length?'Ambiguous record; select one candidate':'Record not found');e.candidates=hits;throw e;}
 return (await db.query(`select * from ${t} where id=$1`,[hits[0].id]))[0];
}
async function insert(db,t,fields){const keys=Object.keys(fields);return (await db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(fields)))[0];}
async function update(db,t,id,fields){const keys=Object.keys(fields);return (await db.query(`update ${t} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(fields),id]))[0];}
async function openEngagement(db,id){const [e]=await db.query('select * from engagements where id=$1 for update',[id]);if(!e||e.status!=='open')throw Error('Engagement is assembled; reopen with a reason first');return e;}
async function lockedRecord(db,t,term){const x=await resolve(db,t,term);await openEngagement(db,x.engagement_id);return (await db.query(`select * from ${t} where id=$1 for update`,[x.id]))[0];}
async function joinedHistory(db,id){const out={engagement:(await db.query('select * from engagements where id=$1',[id]))[0]};for(const t of ['workpapers','requests','review_notes','notes'])out[t]=await db.query(`select * from ${t} where engagement_id=$1 order by created_at,id`,[id]);out.activity=await db.query("select * from activity where (entity='engagements' and record_id=$1) or after_record->>'engagement_id'=$2 order by created_at,id",[id,id]);return out;}
const insightQueries=[
 ['Which high-risk workpapers still lack evidence?',"select e.code engagement,w.code,w.name,w.owner from workpapers w join engagements e on e.id=w.engagement_id where w.risk='high' and coalesce(trim(w.evidence_ref),'')=''"],
 ['Which prepared workpapers still have open review points?',"select engagement,code,name,open_notes from review_queue where status='prepared' and open_notes>0"],
 ['Which evidence owners have overdue requests?',"select owner,count(*)::int overdue from request_chase where due_date<current_date group by owner order by overdue desc"],
 ['Which engagements are due soon with unresolved evidence?',"select code,name,due_date,outstanding_requests from engagement_progress where status='open' and due_date<=current_date+14 and outstanding_requests>0"],
 ['Which files passed their assembly deadline?',"select code,name,assembly_due from engagements where status='open' and assembly_due<current_date"],
 ['Which received requests still await acceptance?',"select engagement,code,name,owner from request_chase where status='received'"],
 ['Who has prepared work waiting more than a week?',"select e.code engagement,w.code,w.prepared_by,w.prepared_at from workpapers w join engagements e on e.id=w.engagement_id where w.status='prepared' and w.prepared_at<now()-interval '7 days'"],
 ['Which significant review points remain unresolved?',"select e.code engagement,n.name,n.owner,n.due_date from review_notes n join engagements e on e.id=n.engagement_id where n.severity='significant' and n.status='open'"],
 ['Which reported engagements have no retention decision?',"select code,name,report_date from engagements where report_date is not null and retention_until is null"],
 ['Which engagement has the most unfinished work per partner?',"select code,partner,unreviewed,outstanding_requests,open_notes,(unreviewed+outstanding_requests+open_notes) outstanding from engagement_progress where status='open' order by outstanding desc,code"]
];
async function importData(db,dir,o){
 const mapping=JSON.parse(fs.readFileSync(path.resolve(required(o,'mapping')),'utf8'));const batch=required(o,'batch');
 const raw={};for(const t of ['engagements','workpapers','requests']){const f=path.resolve(dir,`${t}.csv`);raw[t]=fs.readFileSync(f,'utf8');}
 const fingerprint=createHash('sha256').update(JSON.stringify({raw,mapping})).digest('hex');
 const existing=await db.query('select * from import_batches where fingerprint=$1',[fingerprint]);if(existing.length)return {replayed:true,batch:existing[0].name,counts:existing[0].counts};
 if((await db.query('select id from import_batches where name=$1',[batch])).length)throw Error('Batch name already used for different content');
 const fields={engagements:['code','name','client','partner','period_end','due_date','jurisdiction','standard_version'],workpapers:['engagement','code','name','owner','assertion','risk','due_date','evidence_ref'],requests:['engagement','code','name','owner','due_date','evidence_ref']};
 const counts={};
 for(const t of Object.keys(raw)){
  const rows=parseCsv(raw[t]);if(!rows.length)throw Error(`Empty ${t}.csv; include at least one row for each supported type`);
  const map=mapping[t];if(!map||typeof map!=='object'||Array.isArray(map))throw Error(`Missing mapping for ${t}`);
  if(Object.keys(map).some(k=>!fields[t].includes(k)))throw Error(`Unsupported mapping in ${t}`);
  for(const row of rows){
   for(const col of Object.values(map))if(typeof col!=='string'||!Object.keys(row).some(k=>k.toLowerCase()===col.toLowerCase()))throw Error(`Mapped column ${col} missing in ${t}`);
   const x=Object.fromEntries(fields[t].map(k=>[k,map[k]?pick(row,map[k]).trim():'']));
   const must=fields[t].filter(k=>!['evidence_ref','standard_version'].includes(k));for(const k of must)if(!x[k])throw Error(`${t}: empty ${k}`);
   date(x.due_date);
   if(t==='engagements'){date(x.period_end);choice(x.jurisdiction,['NZ','AU','OTHER']);x.standard_version ||= 'Firm review required';}
   else{
    const found=await db.query('select * from engagements where lower(code)=lower($1)',[x.engagement]);if(found.length!==1)throw Error(`Unknown or ambiguous engagement code ${x.engagement}`);
    await openEngagement(db,found[0].id);x.engagement_id=found[0].id;delete x.engagement;
    if(t==='workpapers')choice(x.risk,['low','medium','high']);
    x.evidence_ref ||= null;
   }
   await insert(db,t,x);
  }
  counts[t]=rows.length;
 }
 await insert(db,'import_batches',{name:batch,fingerprint,counts:JSON.stringify(counts)});
 return {replayed:false,batch,counts,note:'Imported as unreviewed records. Reconcile attachments, historical sign-offs and final-file locks separately.'};
}
async function perform(db,cmd,pos,o){
 if(readSql[cmd])return db.query(readSql[cmd]);
 if(cmd==='history')return joinedHistory(db,(await resolve(db,'engagements',pos[0])).id);
 if(cmd==='weekly-review')return {engagements:await db.query(readSql.engagements),review:await db.query(readSql['review-queue']),requests:await db.query(readSql['request-chase'])};
 if(cmd==='attention')return {late_workpapers:await db.query('select * from review_queue where due_date<current_date order by due_date'),late_requests:await db.query('select * from request_chase where due_date<current_date order by due_date'),open_review_notes:await db.query("select name,owner,due_date,severity from review_notes where status='open' order by due_date"),assembly:await db.query("select code,assembly_due from engagements where status='open' and assembly_due<current_date")};
 if(cmd==='insights'){const results=[];for(const [question,sql] of insightQueries)results.push({question,rows:await db.query(sql)});return results;}
 if(cmd==='add-engagement')return insert(db,'engagements',{code:required(o,'code'),name:required(o,'name'),client:required(o,'client'),partner:required(o,'partner'),period_end:date(required(o,'period-end')),due_date:date(required(o,'due')),jurisdiction:choice(o.jurisdiction||'NZ',['NZ','AU','OTHER']),standard_version:o.standard||'Firm review required'});
 if(['add-workpaper','add-request'].includes(cmd)){
  const e=await resolve(db,'engagements',required(o,'engagement'));await openEngagement(db,e.id);
  const x={engagement_id:e.id,code:required(o,'code'),name:required(o,'name'),owner:required(o,'owner'),due_date:date(required(o,'due'))};
  if(cmd==='add-workpaper')Object.assign(x,{assertion:required(o,'assertion'),risk:choice(required(o,'risk'),['low','medium','high'])});
  return insert(db,cmd==='add-workpaper'?'workpapers':'requests',x);
 }
 if(['receive-request','decide-request'].includes(cmd)){
  const r=await lockedRecord(db,'requests',pos[0]);
  if(['accepted','waived'].includes(r.status))throw Error('Request already decided');
  if(cmd==='receive-request')return update(db,'requests',r.id,{status:'received',evidence_ref:required(o,'evidence')});
  const decision=choice(required(o,'decision'),['accepted','waived']);if(decision==='accepted'&&r.status!=='received')throw Error('Receive evidence before acceptance');
  return update(db,'requests',r.id,{status:decision,decision_reason:required(o,'reason'),decided_by:o.actor,decided_at:new Date().toISOString()});
 }
 if(['prepare','review','revise','add-review-note'].includes(cmd)){
  const w=await lockedRecord(db,'workpapers',pos[0]);
  if(cmd==='prepare'){
   if(w.status!=='open')throw Error('Revise the workpaper before changing preparation');
   return update(db,'workpapers',w.id,{status:'prepared',evidence_ref:required(o,'evidence'),procedure_text:required(o,'procedure'),conclusion:required(o,'conclusion'),prepared_by:o.actor,prepared_at:new Date().toISOString()});
  }
  if(cmd==='review'){
   if(w.status!=='prepared')throw Error('Only prepared workpapers can be reviewed');
   if(w.prepared_by.trim().toLowerCase()===o.actor.trim().toLowerCase())throw Error('Independent reviewer required by this workspace policy');
   if((await db.query("select id from review_notes where workpaper_id=$1 and status='open'",[w.id])).length)throw Error('Resolve open review notes first');
   return update(db,'workpapers',w.id,{status:'reviewed',reviewed_by:o.actor,reviewed_at:new Date().toISOString(),review_extent:required(o,'extent')});
  }
  if(cmd==='revise'){
   required(o,'reason');return update(db,'workpapers',w.id,{status:'open',prepared_by:null,prepared_at:null,reviewed_by:null,reviewed_at:null,review_extent:null});
  }
  if(w.status==='reviewed')throw Error('Revise the reviewed workpaper before raising another point');
  return insert(db,'review_notes',{engagement_id:w.engagement_id,workpaper_id:w.id,name:required(o,'name'),owner:required(o,'owner'),due_date:date(required(o,'due')),severity:choice(o.severity||'normal',['normal','significant'])});
 }
 if(cmd==='resolve-note'){
  const n=await lockedRecord(db,'review_notes',pos[0]);if(n.status!=='open')throw Error('Review note already resolved');
  return update(db,'review_notes',n.id,{status:'resolved',resolution:required(o,'resolution'),resolved_by:o.actor,resolved_at:new Date().toISOString()});
 }
 if(['record-report','assemble','reopen','log'].includes(cmd)){
  const selected=await resolve(db,'engagements',pos[0]);const [e]=await db.query('select * from engagements where id=$1 for update',[selected.id]);
  if(cmd==='reopen'){
   if(e.status!=='assembled')throw Error('Only assembled engagements can reopen');required(o,'reason');
   return update(db,'engagements',e.id,{status:'open',assembled_at:null});
  }
  await openEngagement(db,e.id);
  if(cmd==='log')return insert(db,'notes',{engagement_id:e.id,name:required(o,'text')});
  if(cmd==='record-report'){
   const d=date(required(o,'report-date')),a=date(required(o,'assembly-due')),r=date(required(o,'retention-until'));
   if(d<e.period_end)throw Error('Report date precedes the period end');if(d>new Date().toISOString().slice(0,10))throw Error('Report date cannot be in the future');if(a<d||r<a)throw Error('Dates must run report, assembly, retention in order');
   return update(db,'engagements',e.id,{report_date:d,assembly_due:a,retention_until:r,standard_version:required(o,'standard')});
  }
  const [p]=await db.query('select * from engagement_progress where id=$1',[e.id]);
  if(!p.workpapers||p.unreviewed||p.outstanding_requests||p.open_notes)throw Error('Assembly blocked: require workpapers, independent reviews, decided requests and no open notes');
  if(!e.report_date||!e.assembly_due||!e.retention_until||e.standard_version==='Firm review required')throw Error('Record report, assembly, retention and standard decisions first');
  return update(db,'engagements',e.id,{status:'assembled',assembled_at:new Date().toISOString()});
 }
 if(cmd==='import'){if(pos[0]!=='auditfile'||!pos[1])throw Error('Use import auditfile <directory> --mapping=<file> --batch=<name>');return importData(db,pos[1],o);}
 if(cmd==='export'){
  const data={format:'audit-workpapers-v1',exported_at:new Date().toISOString()};for(const t of tables)data[t]=await db.query(`select * from ${t} order by created_at,id`);
  if(o.out){const out=path.resolve(o.out);fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return {file:out,counts:Object.fromEntries(tables.map(t=>[t,data[t].length]))};}return data;
 }
 if(cmd==='draft-requests'){
  const e=await resolve(db,'engagements',pos[0]);const rows=await db.query("select code,name,owner,due_date,status from requests where engagement_id=$1 and status not in ('accepted','waived') order by due_date",[e.id]);
  const file=writeOut('drafts',`requests-${e.id}-${randomUUID()}`,page({title:'Draft evidence request',subtitle:e.name,sections:[{title:'For operator review before sending',note:'Fictional records in the demo. Check recipient, scope and dates before using this draft.',html:htmlTable(rows)}]}));return {file,requests:rows.length,sent:false};
 }
 throw Error(`Unknown command: ${cmd}`);
}
export async function run(db,argv){
 const {cmd,pos,opts:o}=parseArgs(argv);
 if(cmd==='help'||o.help)return Object.entries(commands).map(([command,description])=>({command,description}));
 if(!commands[cmd])throw Error(`Unknown command: ${cmd}`);
 const allowed=new Set(['json','actor','dry-run',...(specs[cmd]||[])]);for(const k of Object.keys(o))if(!allowed.has(k))throw Error(`Unknown option --${k}`);
 if(o['dry-run']&&!writes.has(cmd))throw Error('--dry-run is only for database writes');
 if(writes.has(cmd))o.actor=required(o,'actor');
 await db.exec(writes.has(cmd)?'BEGIN':'BEGIN READ ONLY');
 try{
  if(writes.has(cmd))await db.query("select set_config('app.actor',$1,true),set_config('app.reason',$2,true),set_config('app.action',$3,true)",[o.actor,String(o.reason||o.resolution||cmd),cmd]);
  const out=await perform(db,cmd,pos,o);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');
  return o['dry-run']?{dry_run:true,result:out}:out;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export function human(data){
 if(Array.isArray(data)){
  if(data[0]?.question)return data.map(x=>x.question+'\n'+human(x.rows)).join('\n\n');
  if(!data.length)return '  (none)';
  const cols=Object.keys(data[0]).filter(k=>!['id','created_at','updated_at','before_record','after_record'].includes(k));
  return table(data,cols.map(k=>({key:k,label:k,width:45,format:v=>v===null?'':typeof v==='object'?JSON.stringify(v):String(v)})));
 }
 if(data&&typeof data==='object')return Object.entries(data).map(([k,v])=>`${k}:\n${typeof v==='object'?human(v):String(v)}`).join('\n');
 return String(data??'');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const out=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(out,null,2):human(out));}
 catch(e){console.error(process.argv.includes('--json')?JSON.stringify({error:e.message,...(e.candidates?{candidates:e.candidates}:{})}):`${e.message}${e.candidates?'\n'+human(e.candidates):''}`);process.exitCode=1;}
 finally{if(db)await db.close();}
}

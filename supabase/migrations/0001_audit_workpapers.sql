create table engagements (
 id uuid primary key default gen_random_uuid(), code text not null unique check(length(trim(code))>0), name text not null check(length(trim(name))>0),
 client text not null, partner text not null, period_end date not null, due_date date not null,
 jurisdiction text not null default 'NZ' check(jurisdiction in ('NZ','AU','OTHER')),
 standard_version text not null default 'Firm review required',
 report_date date, assembly_due date, retention_until date,
 status text not null default 'open' check(status in ('open','assembled')), assembled_at timestamptz,
 check (assembly_due is null or report_date is not null), check(retention_until is null or retention_until >= report_date),
 check(status <> 'assembled' or (assembled_at is not null and report_date is not null and retention_until is not null)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table workpapers (
 id uuid primary key default gen_random_uuid(), engagement_id uuid not null references engagements(id), code text not null,
 name text not null, owner text not null, assertion text not null, risk text not null check(risk in ('low','medium','high')),
 due_date date not null, evidence_ref text, procedure_text text, conclusion text,
 status text not null default 'open' check(status in ('open','prepared','reviewed')),
 prepared_by text, prepared_at timestamptz, reviewed_by text, reviewed_at timestamptz, review_extent text,
 unique(engagement_id,code),
 check(status='open' or (length(trim(coalesce(evidence_ref,'')))>0 and length(trim(coalesce(procedure_text,'')))>0 and length(trim(coalesce(conclusion,'')))>0 and prepared_by is not null and prepared_at is not null)),
 check(status<>'reviewed' or (reviewed_by is not null and reviewed_at is not null and length(trim(coalesce(review_extent,'')))>0 and lower(trim(reviewed_by))<>lower(trim(prepared_by)))),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table requests (
 id uuid primary key default gen_random_uuid(), engagement_id uuid not null references engagements(id), code text not null,
 name text not null, owner text not null, due_date date not null,
 status text not null default 'open' check(status in ('open','received','accepted','waived')),
 evidence_ref text, decision_reason text, decided_by text, decided_at timestamptz,
 unique(engagement_id,code),
 check(status not in ('received','accepted') or length(trim(coalesce(evidence_ref,'')))>0),
 check(status not in ('accepted','waived') or (length(trim(coalesce(decision_reason,'')))>0 and decided_by is not null and decided_at is not null)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table review_notes (
 id uuid primary key default gen_random_uuid(), engagement_id uuid not null references engagements(id), workpaper_id uuid not null references workpapers(id),
 name text not null, owner text not null, due_date date not null, severity text not null check(severity in ('normal','significant')),
 status text not null default 'open' check(status in ('open','resolved')), resolution text, resolved_by text, resolved_at timestamptz,
 check(status<>'resolved' or (length(trim(coalesce(resolution,'')))>0 and resolved_by is not null and resolved_at is not null)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table notes (
 id uuid primary key default gen_random_uuid(), engagement_id uuid not null references engagements(id), name text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_batches (
 id uuid primary key default gen_random_uuid(), name text not null unique, fingerprint text not null unique, counts jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), entity text not null, record_id uuid not null, actor text not null,
 operation text not null, reason text not null, before_record jsonb, after_record jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function guard_record() returns trigger language plpgsql as $$
declare eg uuid; parent_status text; actual uuid;
begin
 if nullif(trim(current_setting('app.actor',true)),'') is null then raise exception 'Actor required'; end if;
 if TG_OP='DELETE' then raise exception 'Deletion is not supported'; end if;
 if TG_TABLE_NAME='engagements' then
   if TG_OP='UPDATE' and OLD.status='assembled' and not (NEW.status='open' and current_setting('app.action',true)='reopen') then raise exception 'Assembled engagement is locked'; end if;
 elsif TG_TABLE_NAME in ('workpapers','requests','review_notes','notes') then
   eg := NEW.engagement_id;
   select status into parent_status from engagements where id=eg for update;
   if parent_status='assembled' then raise exception 'Assembled engagement is locked'; end if;
   if TG_OP='UPDATE' and NEW.engagement_id<>OLD.engagement_id then raise exception 'Cannot move records between engagements'; end if;
   if TG_TABLE_NAME='review_notes' then
     select engagement_id into actual from workpapers where id=NEW.workpaper_id;
     if actual is distinct from eg then raise exception 'Review note must match workpaper engagement'; end if;
   end if;
 end if;
 NEW.updated_at:=now(); return NEW;
end $$;
create function record_activity() returns trigger language plpgsql as $$
begin
 insert into activity(entity,record_id,actor,operation,reason,before_record,after_record)
 values(TG_TABLE_NAME,NEW.id,current_setting('app.actor',true),TG_OP,coalesce(current_setting('app.reason',true),''),case when TG_OP='UPDATE' then to_jsonb(OLD) else null end,to_jsonb(NEW));
 return NEW;
end $$;
create function keep_activity() returns trigger language plpgsql as $$ begin raise exception 'Activity is append only'; end $$;
create trigger immutable_activity before update or delete on activity for each row execute function keep_activity();
create trigger guard_engagements before insert or update or delete on engagements for each row execute function guard_record();
create trigger audit_engagements after insert or update on engagements for each row execute function record_activity();
create trigger guard_workpapers before insert or update or delete on workpapers for each row execute function guard_record();
create trigger audit_workpapers after insert or update on workpapers for each row execute function record_activity();
create trigger guard_requests before insert or update or delete on requests for each row execute function guard_record();
create trigger audit_requests after insert or update on requests for each row execute function record_activity();
create trigger guard_review_notes before insert or update or delete on review_notes for each row execute function guard_record();
create trigger audit_review_notes after insert or update on review_notes for each row execute function record_activity();
create trigger guard_notes before insert or update or delete on notes for each row execute function guard_record();
create trigger audit_notes after insert or update on notes for each row execute function record_activity();
create trigger guard_import_batches before insert or update or delete on import_batches for each row execute function guard_record();
create trigger audit_import_batches after insert or update on import_batches for each row execute function record_activity();
alter table engagements enable row level security;
revoke all on engagements from public;
alter table workpapers enable row level security;
revoke all on workpapers from public;
alter table requests enable row level security;
revoke all on requests from public;
alter table review_notes enable row level security;
revoke all on review_notes from public;
alter table notes enable row level security;
revoke all on notes from public;
alter table import_batches enable row level security;
revoke all on import_batches from public;
alter table activity enable row level security;
revoke all on activity from public;

create view engagement_progress as
select e.id,e.code,e.name,e.partner,e.due_date,e.status,
 (select count(*)::int from workpapers w where w.engagement_id=e.id) workpapers,
 (select count(*)::int from workpapers w where w.engagement_id=e.id and w.status<>'reviewed') unreviewed,
 (select count(*)::int from requests r where r.engagement_id=e.id and r.status not in ('accepted','waived')) outstanding_requests,
 (select count(*)::int from review_notes n where n.engagement_id=e.id and n.status='open') open_notes,
 e.report_date,e.assembly_due,e.retention_until
from engagements e;
create view review_queue as
select w.id,e.code engagement,w.code,w.name,w.owner,w.risk,w.status,w.due_date,
 (select count(*)::int from review_notes n where n.workpaper_id=w.id and n.status='open') open_notes,
 w.prepared_by,w.reviewed_by
from workpapers w join engagements e on e.id=w.engagement_id where e.status='open' and w.status<>'reviewed';
create view request_chase as
select r.id,e.code engagement,r.code,r.name,r.owner,r.due_date,r.status,(current_date-r.due_date) days_late
from requests r join engagements e on e.id=r.engagement_id
where e.status='open' and r.status not in ('accepted','waived');
create view documentation_checks as
select e.id,'engagement' kind,e.code reference,'assembly_date_missing' rule,'Record the firm-approved assembly deadline' detail from engagements e where report_date is not null and assembly_due is null
union all select e.id,'engagement',e.code,'assembly_overdue','File assembly deadline has passed' from engagements e where status='open' and assembly_due<current_date
union all select e.id,'engagement',e.code,'retention_missing','Record the applicable retention decision' from engagements e where report_date is not null and retention_until is null
union all select e.id,'engagement',e.code,'retention_review','Retention date has arrived; review holds, do not delete' from engagements e where retention_until<=current_date
union all select e.id,'engagement',e.code,'standard_review','Confirm jurisdiction and the applicable standard version' from engagements e where standard_version='Firm review required'
union all select w.id,'workpaper',e.code||'/'||w.code,'evidence_missing','Evidence reference is missing' from workpapers w join engagements e on e.id=w.engagement_id where coalesce(trim(w.evidence_ref),'')=''
union all select w.id,'workpaper',e.code||'/'||w.code,'preparation_missing','Procedure, conclusion and preparer await recording' from workpapers w join engagements e on e.id=w.engagement_id where w.status='open'
union all select w.id,'workpaper',e.code||'/'||w.code,'review_pending','Reviewer and extent of review await recording' from workpapers w join engagements e on e.id=w.engagement_id where w.status='prepared';
revoke all on engagement_progress,review_queue,request_chase,documentation_checks from public;

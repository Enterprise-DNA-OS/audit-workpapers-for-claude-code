select set_config('app.actor','Demo seed',true),set_config('app.reason','Fictional demo',true);
insert into engagements(id,code,name,client,partner,period_end,due_date,jurisdiction,standard_version,report_date,assembly_due,retention_until) values
('10000000-0000-4000-8000-000000000001','HBR26','Harbour Foods annual audit','Harbour Foods (fictional)','Mira Chen',current_date-90,current_date+12,'NZ','Firm review required',null,null,null),
('10000000-0000-4000-8000-000000000002','HBR25','Harbour Foods prior year','Harbour Foods (fictional)','Mira Chen',current_date-455,current_date-60,'NZ','ISA NZ 230, periods from 15 Dec 2023',current_date-70,current_date-10,current_date+1800),
('10000000-0000-4000-8000-000000000003','KOW26','Kowhai Trust annual audit','Kowhai Trust (fictional)','Leo Martin',current_date-45,current_date+25,'NZ','Firm review required',null,null,null)
on conflict do nothing;
insert into workpapers(id,engagement_id,code,name,owner,assertion,risk,due_date,evidence_ref,procedure_text,conclusion,status,prepared_by,prepared_at) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','C100','Cash confirmation','Aroha Blake','Existence','high',current_date-4,null,null,null,'open',null,null),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','I200','Inventory count review','Aroha Blake','Existence','high',current_date+2,'evidence://demo/count-sheet','Fictional count attendance procedure','Fictional observation recorded for reviewer','prepared','Aroha Blake',now()-interval '8 days'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','F900','Final file index','Niko Evans','Presentation','medium',current_date-11,'evidence://demo/prior-index','Index prepared','Pending independent review','prepared','Niko Evans',now()-interval '12 days'),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000003','G100','Grant conditions','Niko Evans','Completeness','medium',current_date+5,null,null,null,'open',null,null)
on conflict do nothing;
insert into requests(id,engagement_id,code,name,owner,due_date,status,evidence_ref) values
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','R01','Bank confirmation','Client finance lead',current_date-7,'open',null),
('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','R02','Inventory count sheets','Client warehouse lead',current_date-3,'received','evidence://demo/count-sheet'),
('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','R01','Grant agreement','Trust administrator',current_date+1,'open',null)
on conflict do nothing;
insert into review_notes(id,engagement_id,workpaper_id,name,owner,due_date,severity) values
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Explain count difference follow-up','Aroha Blake',current_date-2,'significant')
on conflict do nothing;

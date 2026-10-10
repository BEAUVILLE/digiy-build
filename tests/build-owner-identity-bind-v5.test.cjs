'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const template=fs.readFileSync(path.join(__dirname,'..','supabase/ops/BUILD_OWNER_IDENTITY_BIND_V5_MANUAL.sql'),'utf8');
const uid='11111111-1111-4111-8111-111111111111';
const old='99999999-9999-4999-8999-999999999999';
const noUser='22222222-2222-4222-8222-222222222222';
const pgEnabled=process.env.BUILD_OWNER_FIXTURE_POSTGRES==='1';
if(pgEnabled && !(process.env.PGDATABASE==='build_owner_fixture' && ['localhost','127.0.0.1'].includes(process.env.PGHOST) && process.env.PGUSER==='postgres')){
 throw Error('Refusing to run SQL tests outside isolated localhost build_owner_fixture');
}
function pg(sql,{ok=true}={}){
 const r=spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-q','-t','-A'],{
  input:sql,encoding:'utf8',timeout:15000,env:{...process.env,PGOPTIONS:'-c statement_timeout=10000'}});
 assert.equal(r.error,undefined,String(r.error||''));
 if(ok)assert.equal(r.status,0,r.stderr);
 else assert.notEqual(r.status,0,'expected SQL rejection');
 return (r.stdout||'')+'\n'+(r.stderr||'');
}
function fixture(){
 pg(`drop schema if exists auth cascade;
drop schema if exists private cascade;
drop table if exists public.digiy_build_public_profiles cascade;
do $$begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
end$$;
create schema auth;
create schema private;
create table auth.users(
 id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz,
 banned_until timestamptz,is_anonymous boolean not null default false
);
insert into auth.users(id,email,email_confirmed_at) values
 ('${uid}','artisan@example.test',now()),
 ('${noUser}','unconfirmed@example.test',null);
create table public.digiy_build_public_profiles(
 slug text primary key,owner_id uuid,is_active boolean not null default true,
 is_published boolean not null default true,updated_at timestamptz not null default now()
);
insert into public.digiy_build_public_profiles(slug,owner_id) values
 ('babacar-plombier-pro',null),('mane-gning-nettoyage',null),
 ('partenaires-kourant',null),('partenaires-mbaye',null),
 ('helage-plombier','${old}');`);
}
function render({slug='babacar-plombier-pro',email='artisan@example.test',
 ref='BUILD-25-human-reviewed',expected=null,proved=true,apply=false}={}){
 let s=template.replace('__CHOISIR_UN_DES_CINQ_SLUGS__',slug)
   .replace('__EMAIL_CONFIRME_PAR_ARTISAN__',email)
   .replace('__REFERENCE_CONTROLE_HUMAIN_PRIVE__',ref)
   .replace('v_ownership_proved boolean := false;','v_ownership_proved boolean := '+proved+';')
   .replace('v_execute boolean := false;','v_execute boolean := '+apply+';');
 if(expected!==null)s=s.replace('v_expected_previous_owner uuid := NULL;','v_expected_previous_owner uuid := \''+expected+'\';');
 return s;
}
function get(sql){return pg(sql).trim()}
test('manual template defaults to safe NO-OP and only five named pilot slugs',()=>{
 assert.match(template,/v_execute boolean := false/);
 assert.match(template,/v_ownership_proved boolean := false/);
 assert.match(template,/IF current_user NOT IN \('postgres','supabase_admin'\)/);
 assert.match(template,/FROM auth\.users/);
 assert.match(template,/FOR UPDATE/);
 assert.match(template,/old_owner_uid/);
 assert.match(template,/REVOKE ALL ON private\.digiy_build_owner_link_audit_v1 FROM PUBLIC, anon, authenticated/);
 assert.doesNotMatch(template,/service_role|user_metadata|CREATE USER/i);
});
test('fixture preview remains read-only and does not create an audit table',{skip:!pgEnabled},()=>{
 fixture();
 pg(render({proved:true,apply:false}));
 assert.equal(get("select count(*) from public.digiy_build_public_profiles where owner_id is not null;"),'1');
 assert.equal(get("select count(*) from pg_tables where schemaname='private' and tablename='digiy_build_owner_link_audit_v1';"),'0');
});
test('fixture rejects missing identity approval and unknown email',{skip:!pgEnabled},()=>{
 fixture();
 pg(render({proved:false,apply:true}),{ok:false});
 pg(render({email:'missing@example.test',apply:true}),{ok:false});
 pg(render({email:'unconfirmed@example.test',apply:true}),{ok:false});
 assert.equal(get("select count(*) from public.digiy_build_public_profiles where owner_id='"+uid+"';"),'0');
});
test('fixture commits one verified owner and audit event; anon cannot read log',{skip:!pgEnabled},()=>{
 fixture();
 pg(render({apply:true}));
 assert.equal(get("select count(*) from public.digiy_build_public_profiles where slug='babacar-plombier-pro' and owner_id='"+uid+"';"),'1');
 assert.equal(get("select count(*) from private.digiy_build_owner_link_audit_v1 where profile_slug='babacar-plombier-pro' and new_owner_uid='"+uid+"';"),'1');
 assert.equal(get("select has_table_privilege('anon','private.digiy_build_owner_link_audit_v1','SELECT');"),'f');
 assert.equal(get("select has_table_privilege('authenticated','private.digiy_build_owner_link_audit_v1','SELECT');"),'f');
});
test('fixture never silently overwrites an orphan owner without prior UUID proof',{skip:!pgEnabled},()=>{
 fixture();
 pg(render({slug:'helage-plombier',apply:true}),{ok:false});
 assert.equal(get("select owner_id from public.digiy_build_public_profiles where slug='helage-plombier';"),old);
 pg(render({slug:'helage-plombier',expected:old,apply:true}));
 assert.equal(get("select owner_id from public.digiy_build_public_profiles where slug='helage-plombier';"),uid);
});
test('fixture rejects duplicate active owner linkage',{skip:!pgEnabled},()=>{
 fixture();
 pg(render({apply:true}));
 pg(render({slug:'mane-gning-nettoyage',apply:true}),{ok:false});
 assert.equal(get("select count(*) from public.digiy_build_public_profiles where owner_id='"+uid+"';"),'1');
});

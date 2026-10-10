'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const access=fs.readFileSync(path.join(__dirname,'acces-proprietaire-v3.html'),'utf8');
const gestion=fs.readFileSync(path.join(__dirname,'gestion-build-v2.html'),'utf8');
const accessJs=access.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
const ownerJs=gestion.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(accessJs && ownerJs);
const slug='jb-baptiste-build';

function dom(){
 const n=new Map();
 const $=id=>{if(!n.has(id))n.set(id,{id,hidden:true,disabled:false,href:'',textContent:'',className:'',value:'',innerHTML:'',
  classList:{toggle(){},add(){}},checked:false,addEventListener(){},querySelector(){return null},
  querySelectorAll(){return []},setAttribute(){}});
  return n.get(id)};
 return {$,document:{documentElement:{lang:'fr',dir:'ltr'},getElementById:$,querySelectorAll:()=>[]}};
}
async function login({withSite=true}={}){
 const d=dom(),requests=[],stored={};
 const url='https://build.digiylyfe.com/acces-proprietaire-v3.html'+(withSite?'?site='+slug+'&lang=fr':'?lang=fr');
 const location={href:url,origin:'https://build.digiylyfe.com'};
 const sb={auth:{signInWithOtp:async params=>{requests.push(params);return {error:null}}}};
 const storage={getItem:()=>null,setItem:(k,v)=>stored[k]=v};
 vm.runInNewContext(accessJs,{window:{supabase:{createClient:()=>sb}},document:d.document,URL,location,
  localStorage:storage},{timeout:1000});
 d.$('email').value='owner@example.test';
 await d.$('send').onclick();
 return {requests,stored};
}
async function management({loggedIn=true,owner=true,withSite=true}={}){
 const d=dom(),reads=[],historyWrites=[],storage={};
 const href='https://build.digiylyfe.com/gestion-build-v2.html';
 const location={href,origin:'https://build.digiylyfe.com'};
 const pUser=loggedIn?{id:'test-owner',email:'owner@example.test'}:null;
 const sb={
  auth:{getUser:async()=>({data:{user:pUser},error:null}),signOut:async()=>({error:null})},
  from(table){
   reads.push(table);
   const filters={};
   const q={select(){return q},eq(k,v){filters[k]=v;return q},
     order(){return q},
     limit:async()=>{
       if(table==='digiy_build_public_profiles')
         return {data:owner?[{slug}]:[],error:null};
       return {data:[],error:null}
     },
     maybeSingle:async()=>({data:owner && filters.owner_id==='test-owner' && filters.slug===slug ?
       {slug,owner_id:'test-owner',display_name:'JB Baptiste',trade:'Artisan',
        services_text:'',zone:'',hub_badge:''}:null,error:null})
   };
   return q;
  }
 };
 vm.runInNewContext(ownerJs,{
  window:{supabase:{createClient:()=>sb},DIGIY_OWNER_PHONE_MFA:{guard:async()=>true}},
  document:d.document,location,URL,console,
  history:{replaceState:(_a,_b,x)=>historyWrites.push(x)},
  localStorage:{getItem:k=>withSite && k==='digiy_build_owner_site'?slug:null,setItem:(k,v)=>storage[k]=v}
 },{timeout:1000});
 await new Promise(resolve=>setImmediate(resolve));
 return {d,reads,historyWrites,storage};
}
test('BUILD real owner portal sends existing-user magic link and preserves site',async()=>{
 const r=await login();
 assert.equal(r.requests.length,1);
 assert.equal(r.requests[0].options.shouldCreateUser,false);
 assert.match(r.requests[0].options.emailRedirectTo,/gestion-build-v2\.html/);
 assert.equal(r.stored.digiy_build_owner_site,slug);
});
test('BUILD future member generic entry sends magic link without guessed owner',async()=>{
 const r=await login({withSite:false});
 assert.equal(r.requests.length,1);
 assert.equal(r.requests[0].options.shouldCreateUser,false);
});
test('BUILD authenticated user can enter only the explicitly owned pilot profile',async()=>{
 const r=await management();
 assert.equal(r.d.$('editor').hidden,false);
 assert.equal(r.d.$('businessName').textContent,'JB Baptiste');
 assert.ok(r.reads.includes('digiy_build_public_profiles'));
 assert.ok(r.reads.includes('digiy_build_demandes'));
});
test('BUILD no session does not read any sensitive profile or request',async()=>{
 const r=await management({loggedIn:false});
 assert.deepEqual(r.reads,[]);
 assert.equal(r.d.$('editor').hidden,true);
});
test('BUILD another user cannot read a profile or private client requests',async()=>{
 const r=await management({owner:false});
 assert.equal(r.d.$('editor').hidden,true);
 assert.ok(!r.reads.includes('digiy_build_demandes'));
});
test('BUILD magic-link return without slug discovers sole Auth-owned active profile',async()=>{
 const r=await management({withSite:false});
 assert.equal(r.d.$('editor').hidden,false);
 assert.equal(r.historyWrites.length,1);
 assert.match(r.historyWrites[0],/site=jb-baptiste-build/);
});

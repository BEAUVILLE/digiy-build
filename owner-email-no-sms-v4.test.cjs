'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const helper=fs.readFileSync(require('node:path').join(__dirname,'owner-phone-mfa-v1.js'),'utf8');
const html=fs.readFileSync(require('node:path').join(__dirname,'gestion-build-v2.html'),'utf8');
function harness({required=false,registered=true}={}){
 const nodes=new Map(),calls={rpc:0,factors:0,aal:0,challenge:0,enroll:0};
 const document={
  getElementById:id=>nodes.get(id)||null,
  createElement:()=>({className:'',innerHTML:'',textContent:'',appendChild(){},querySelector(){return null}}),
  head:{appendChild(){}},body:{prepend(x){nodes.set('digiyOwnerMfaBox',x)}}
 };
 const sb={
  rpc:async()=>{calls.rpc++;return {data:{ok:registered,required,phone:'+221770000000',masked_phone:'•••• 0000'},error:null}},
  auth:{mfa:{
   getAuthenticatorAssuranceLevel:async()=>{calls.aal++;return {data:{currentLevel:'aal1'},error:null}},
   listFactors:async()=>{calls.factors++;return {data:{phone:[]},error:null}},
   enroll:async()=>{calls.enroll++;throw Error('SMS must not be called')},
   challenge:async()=>{calls.challenge++;throw Error('SMS must not be called')}
  }}
 };
 const context={document,window:{},setTimeout,location:{reload(){}}};
 vm.runInNewContext(helper,context,{timeout:1000});
 return {calls,nodes,sb,guard:context.window.DIGIY_OWNER_PHONE_MFA.guard};
}
test('BUILD: optional phone SMS not offered with email-only owner',async()=>{
 const t=harness();
 const ok=await t.guard({supabase:t.sb,offerEnrollment:false});
 assert.equal(ok,true);
 assert.equal(t.calls.rpc,1);
 assert.equal(t.calls.aal,0);
 assert.equal(t.calls.factors,0);
 assert.equal(t.calls.challenge,0);
 assert.equal(t.calls.enroll,0);
});
test('BUILD: pre-existing mandatory phone MFA still fails closed if unverified',async()=>{
 const t=harness({required:true});
 const ok=await t.guard({supabase:t.sb,offerEnrollment:false});
 assert.equal(ok,false);
 assert.match(t.nodes.get('digiyOwnerMfaBox').innerHTML,/Accès bloqué/);
 assert.equal(t.calls.enroll,0);
});
test('BUILD: owner page keeps its Auth and server-validated ownership requirement',()=>{
 assert.match(html,/DIGIY_OWNER_PHONE_MFA\.guard\(\{supabase:sb,beforeId:"(?:editor|workspaceCard)",offerEnrollment:false\}\)/);
 assert.match(html,/auth\.getUser\(\)/);
 assert.match(html,/eq\("owner_id",user\.id\)|eq\("auth_user_id",user\.id\)/);
 assert.match(helper,/if\(!ctx\.required && !offerEnrollment\) return true/);
});

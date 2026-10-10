'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'gestion-build-v2.html'),'utf8');
const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(inline,'owner script present');
async function run({site='',allowed=false,present=true}={}){
 const calls=[],guards=[],nodes={};
 const dom=id=>nodes[id]??(nodes[id]={value:'',hidden:true,className:'',textContent:'',href:'',addEventListener(){}});
 const document={documentElement:{lang:'fr',dir:'ltr'},getElementById:dom,querySelectorAll:()=>[]};
 const localStorage={getItem:()=>null,setItem(){}};
 const from=table=>{calls.push(table);const q={select(){return q},eq(){return q},order(){return q},limit(){return Promise.resolve({data:[],error:null})}};return q};
 const sb={auth:{getUser:async()=>({data:{user:{id:'synthetic-auth-owner'}},error:null})},from};
 const window={supabase:{createClient:()=>sb}};
 if(present)window.DIGIY_OWNER_PHONE_MFA={guard:async x=>{guards.push(x);return allowed}};
 const href='https://build.digiylyfe.com/gestion-build-v2.html'+(site?'?site='+site:'');
 vm.runInNewContext(inline[1],{window,document,location:{href,origin:'https://build.digiylyfe.com'},localStorage,URL,history:{replaceState(){}},console},{timeout:1000});
 await new Promise(resolve=>setImmediate(resolve));
 return {calls,guards,nodes};
}
test('when slug is absent no owner profile discovery occurs before MFA succeeds',async()=>{
 const r=await run({allowed:false});
 assert.equal(r.guards.length,1);
 assert.equal(r.calls.length,0);
 assert.equal(r.nodes.editor?.hidden??true,true);
});
test('without MFA code, owner remains locked and DB is not read',async()=>{
 const r=await run({present:false});
 assert.equal(r.calls.length,0);
 assert.match(r.nodes.msg.textContent,/téléphone indisponible/i);
});
test('after MFA, legacy data is not auto-imported',async()=>{
 const r=await run({allowed:true});
 assert.equal(r.guards.length,1);
 assert.deepEqual(r.calls,['digiy_build_public_profiles']);
 assert.doesNotMatch(html,/\.from\("digiy_build_artisans"\)/);
});
test('client request data is escaped before displayed',()=>{
 assert.match(html,/esc\(r\.client_nom\|\|"Client"\)/);
 assert.match(html,/esc\(r\.type_travaux\|\|"Demande BUILD"\)/);
 assert.match(html,/esc\(need\)/);
 assert.match(html,/DIGIY_OWNER_PHONE_MFA\.guard/);
 const discovery=html.search(/if\(!siteSlug\)\s*\{\s*const \{data:owned/);
 assert.ok(discovery>=0,'owner profile discovery found');
 assert.ok(html.indexOf('DIGIY_OWNER_PHONE_MFA.guard')<discovery,'guard must precede fallback owner lookup');
});

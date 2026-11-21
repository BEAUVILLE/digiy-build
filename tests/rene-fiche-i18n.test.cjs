'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const test=require('node:test');
const html=fs.readFileSync(path.join(__dirname,'..','rene-rebiez.html'),'utf8');
const langs=['fr','wo','en','es','pt','it','de','nl','zh','ar'];

function parseConst(name,after){
 const start=html.indexOf('const '+name+'=');
 assert.ok(start>=0,'Missing '+name);
 const end=html.indexOf(after,start);
 assert.ok(end>start,'Missing delimiter for '+name);
 return JSON.parse(html.slice(start+('const '+name+'=').length,end));
}
const UI=parseConst('PAGE_UI',';\nconst names=');
const BASE=parseConst('T',"; let lang='fr';");
const CARD=parseConst('CARD_LINKS',';\nconst PAGE_UI=');

test('René public profile includes complete dictionaries in 10 languages',()=>{
 assert.deepEqual(Object.keys(UI).sort(),langs.slice().sort());
 for(const k of langs){
   assert.equal(BASE[k].length,11,'Service dictionary: '+k);
   assert.equal(CARD[k].length,3,'Card UI dictionary: '+k);
   assert.deepEqual(Object.keys(UI[k]).sort(),Object.keys(UI.fr).sort(),'UI fields: '+k);
   for(const [field,value] of Object.entries(UI[k]))assert.ok(typeof value==='string'&&value.length>0,k+' missing '+field);
   if(k!=='fr')assert.notEqual(UI[k].notice,UI.fr.notice,'Notice remains French for '+k);
 }
 assert.ok(html.indexOf('id="langs"')<html.indexOf('id="public"'),'Language picker must appear before the public fiche');
});

test('Ten language buttons translate headings, notice, footer, meta and direction at runtime',()=>{
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script,'Missing public script');
 const nodes=new Map();
 function node(id){
  if(!nodes.has(id))nodes.set(id,{id,textContent:'',innerText:'',href:'',alt:'',dir:'',dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(type,cb){if(type==='click')this.click=cb;},appendChild(child){nodes.set(child.id,child);}});
  return nodes.get(id);
 }
 const translatedNodes=Object.keys(UI.fr).filter(k=>!['title','meta','downloadAria','imageAlt'].includes(k)).map(k=>{const el=node('ui-'+k);el.dataset.reneUi=k;return el;});
 const meta=node('meta');
 const document={
   documentElement:{lang:'fr',dir:'ltr'},
   title:'',
   getElementById:node,
   createElement:()=>({setAttribute(k,v){this[k]=v;},addEventListener(type,cb){if(type==='click')this.click=cb;}}),
   querySelector:(selector)=>selector==='meta[name="description"]'?meta:null,
   querySelectorAll:(selector)=>selector==='[data-rene-ui]'?translatedNodes:[]
 };
 let href='https://build.digiylyfe.com/rene-rebiez.html?utm_source=test&lang=en';
 const location={get href(){return href;},get search(){return new URL(href).search;}};
 const history={replaceState(_a,_b,value){href=String(value);}};
 const context={document,window:{location},location,history,URL,URLSearchParams};
 vm.runInNewContext(script,context,{timeout:1000});
 assert.equal(document.documentElement.lang,'en');
 for(const lang of langs){
   const button=node('lang-'+lang);
   assert.equal(typeof button.click,'function','Missing click handler '+lang);
   button.click();
   assert.equal(document.documentElement.lang,lang==='zh'?'zh-CN':lang,'html lang '+lang);
   assert.equal(document.documentElement.dir,lang==='ar'?'rtl':'ltr','html direction '+lang);
   assert.equal(document.title,UI[lang].title,'title '+lang);
   assert.equal(meta.attrs.content,UI[lang].meta,'meta '+lang);
   assert.equal(node('ui-notice').textContent,UI[lang].notice,'notice '+lang);
   assert.equal(node('ui-footerText').textContent,UI[lang].footerText,'footer '+lang);
   assert.equal(node('downloadActions').attrs['aria-label'],UI[lang].downloadAria,'accessibility '+lang);
   assert.equal(node('cardImage').alt,UI[lang].imageAlt,'card alt '+lang);
   assert.equal(node('backBuild').href,'https://build.digiylyfe.com/?lang='+lang,'return BUILD '+lang);
   assert.equal(new URL(href).searchParams.get('lang'),lang,'query language '+lang);
   assert.equal(new URL(href).searchParams.get('utm_source'),'test','preserve query source '+lang);
   assert.equal(button['aria-pressed'],'true','selected button '+lang);
 }
});

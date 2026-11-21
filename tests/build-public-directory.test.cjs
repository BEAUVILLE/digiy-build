'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const json=JSON.parse(fs.readFileSync(path.join(root,'artisans.json'),'utf8'));
const script=fs.readFileSync(path.join(root,'assets/digiy-build-public-directory-v1.js'),'utf8');
new vm.Script(script);
const context={window:{},URL,URLSearchParams,console};
vm.runInNewContext(script,context,{timeout:1000});
const API=context.window.DIGIY_BUILD_DIRECTORY_V1;
assert.ok(API&&typeof API.buildRegistry==='function');

const names=['Babacar Plombier Pro','Helage','Kourant Électricien','MANÉ & GNING','Mbaye Diouf','PAP Piscine','René Rebiez','SODIOR BTP'];

test('Eight confirmed public profiles, one quarantined record, no fictional paid memberships',()=>{
 const list=API.buildRegistry(json);
 assert.equal(list.length,8);
 assert.deepEqual(Array.from(list,x=>x.name).sort(),names.slice().sort());
 assert.deepEqual(list.reduce((out,x)=>(out[x.kind]=(out[x.kind]||0)+1,out),{}),{published:5,partner:1,guest:2});
 assert.ok(list.every(x=>x.url.startsWith('https://')));
 assert.ok(list.every(x=>!/(adhérent|verified member|membre payant)/i.test(x.kind)));
 assert.ok(list.every(x=>x.department&&x.name));
});

test('PAP Piscine and SODIOR BTP retain their existing official publications',()=>{
 const list=API.buildRegistry(json);
 const pap=list.find(x=>x.name==='PAP Piscine'),sodior=list.find(x=>x.name==='SODIOR BTP');
 assert.equal(pap.kind,'partner');
 assert.equal(sodior.kind,'guest');
 assert.equal(pap.url,'https://digiylyfe.com/fiches/pap-piscine-saly.html');
 assert.equal(sodior.url,'https://digiylyfe.com/cartes/sodior-btp.html');
 assert.equal(pap.department,'piscine');
 assert.equal(sodior.department,'ingenierie');
});

test('Helage canonical URL and no unverified JB Baptiste in public directory',()=>{
 const list=API.buildRegistry(json);
 assert.equal(list.find(x=>x.name==='Helage').url,'https://helage-plombier.digiylyfe.com/');
 assert.ok(!list.some(x=>x.name==='JB Baptiste'));
 assert.ok(json.excluded_or_unconfirmed_profiles.some(x=>x.id==='jb-baptiste-build'&&x.public_listing===false));
});

test('Combining all three sources does not reinstate quarantined records or duplicate professionals',()=>{
 const build=[
  {display_name:'Babacar Plombier Pro',slug:'babacar-plombier-pro',trade:'Plombier',is_published:true,is_active:true},
  {display_name:'Helage',slug:'helage-plombier',trade:'Plombier',is_published:true,is_active:true},
  {display_name:'JB Baptiste',slug:'jb-baptiste-build',trade:'Électricien',is_published:true,is_active:true},
  {display_name:'Kourant Électricien',slug:'partenaires-kourant',trade:'Électricien',is_published:true,is_active:true},
  {display_name:'MANÉ & GNING',slug:'mane-gning-nettoyage',trade:'Nettoyage',is_published:true,is_active:true},
  {display_name:'Mbaye Diouf',slug:'partenaires-mbaye',trade:'Construction',is_published:true,is_active:true},
  {display_name:'Not Published',slug:'not-published',trade:'Construction',is_published:false,is_active:false}
 ];
 const annuaire=[
  {display_name:'Babacar Plombier Pro',category:'artisan',status:'partenaire',entry_type:'professional',is_public:true,is_active:true,public_url:'https://babacar-plombier-pro.digiylyfe.com/'},
  {display_name:'Helage Plombier',category:'artisan',status:'pro',entry_type:'professional',is_public:true,is_active:true,public_url:'https://helage-plombier.digiylyfe.com/'},
  {display_name:'Mbaye Maçon',category:'artisan',status:'partenaire',entry_type:'professional',is_public:true,is_active:true,public_url:'https://mbaye-macon.digiylyfe.com/'},
  {display_name:'PAP Piscine',category:'terrain',status:'partenaire',entry_type:'professional',is_public:true,is_active:true,public_url:'https://digiylyfe.com/fiches/pap-piscine-saly.html'},
  {display_name:'SODIOR BTP',category:'artisan',status:'invite',entry_type:'professional',is_public:true,is_active:true,public_url:'https://digiylyfe.com/cartes/sodior-btp.html'},
  {display_name:'Hidden Artisan',category:'artisan',status:'invite',entry_type:'professional',is_public:false,is_active:true,public_url:'https://digiylyfe.com/hidden.html'},
  {display_name:'Shop',category:'market',status:'pro',entry_type:'professional',is_public:true,is_active:true,public_url:'https://digiylyfe.com/shop.html'}
 ];
 const professionals=[
  {name:'PAP Piscine',category:'service-artisan',is_published:true,is_active:true,website:'https://digiylyfe.com/fiches/pap-piscine-saly.html',card_url:'https://digiylyfe.com/assets/pap-piscine-fiche-officielle.webp'}
 ];
 const combined=API.buildRegistry(json,build,annuaire,professionals);
 assert.equal(combined.length,8);
 assert.ok(!combined.some(x=>x.name==='Not Published'||x.name==='Hidden Artisan'||x.name==='Shop'||x.name==='JB Baptiste'));
 assert.equal(combined.filter(x=>x.name==='Helage').length,1);
 assert.equal(combined.filter(x=>x.name==='Mbaye Diouf').length,1);
 assert.equal(combined.find(x=>x.name==='SODIOR BTP').kind,'guest');
 assert.equal(combined.find(x=>x.name==='PAP Piscine').kind,'partner');
});

test('New published BUILD and invited artisan appear automatically, without granting membership',()=>{
 const extra=[
  {display_name:'Futur artisan peintre',slug:'nouveau-peintre',trade:'Peintre bâtiment',sector:'peinture',city:'Mbour',is_active:true,is_published:true},
  {display_name:'Désactivé',slug:'desactive',trade:'Plombier',is_active:false,is_published:true}
 ];
 const annuaire=[{display_name:'Invité nouvel atelier',activity_label:'Construction',category:'artisan',entry_type:'professional',status:'invite',public_url:'https://digiylyfe.com/atelier.html',is_active:true,is_public:true}];
 const list=API.buildRegistry(json,extra,annuaire);
 assert.equal(list.length,10);
 assert.equal(list.find(x=>x.name==='Futur artisan peintre').kind,'published');
 assert.equal(list.find(x=>x.name==='Futur artisan peintre').department,'peinture');
 assert.equal(list.find(x=>x.name==='Invité nouvel atelier').kind,'guest');
 assert.ok(!list.some(x=>x.name==='Désactivé'));
});

test('One shared component is wired to home, listing and catalogue',()=>{
 for(const page of ['index.html','listing.html','catalogue.html']){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  assert.match(html,/digiy-build-public-directory-v1\.js\?v=20261121-solaire-separe/);
  assert.match(html,/digiy-build-public-directory-v1\.css\?v=20261121-solaire-separe/);
 }
 const css=fs.readFileSync(path.join(root,'assets/digiy-build-public-directory-v1.css'),'utf8');
 assert.match(css,/body\[data-digiy-directory-page="home"\]/);
 assert.match(css,/body\[data-digiy-directory-page="listing"\]/);
 assert.match(css,/body\[data-digiy-directory-page="catalogue"\]/);
 const catalogue=fs.readFileSync(path.join(root,'catalogue.html'),'utf8');
 assert.doesNotMatch(catalogue,/"numberOfItems"\s*:\s*3/);
});

test('All ten languages have visible labels, correct status labels and trade category labels',()=>{
 const data=API.WORDS;
 assert.equal(API.LANGS.length,10);
 for(const l of API.LANGS){
  assert.ok(data[l],l);
  assert.equal(data[l].trades.length,9,l);
  for(const field of ['title','lead','search','all','open','contact','published','partner','guest','count','none']){
   assert.ok(data[l][field]&&typeof data[l][field]==='string',l+' '+field);
  }
 }
});

test('No Supabase mutations, owner changes or backend SQL shipped',()=>{
 assert.doesNotMatch(script,/\.insert\s*\(|\.upsert\s*\(|\.update\s*\(/);
 assert.doesNotMatch(script,/method\s*:\s*['"](?:POST|PATCH|PUT|DELETE)['"]/i);
 assert.doesNotMatch(script,/service_role|sb_secret_/);
});

test('Trade title fallback and all ten locale keys on category pages',()=>{
 const listing=fs.readFileSync(path.join(root,'listing.html'),'utf8');
 assert.match(listing,/trade==="all"\?t\.title:\(t\.cats\[trade\]\|\|t\.title\)/);
 assert.match(script,/if\(page==="listing"\)/);
 assert.match(script,/document\.documentElement\.lang=lang==="zh"\?"zh-CN":lang/);
 assert.match(script,/document\.documentElement\.dir=lang==="ar"\?"rtl":"ltr"/);
 assert.match(script,/WORDS\[lang\]\.trades\[DEPTS\.indexOf\(filter\)\]/);
});

test('Quarantine remains effective for the slug even if an old API row stays active',()=>{
 const oldRow={display_name:'JB Baptiste',slug:'jb-baptiste-build',trade:'Électricien · dépannage',sector:'électricité',is_published:true,is_active:true,profile_url:'https://digiy-solaire.digiylyfe.com/'};
 const rows=API.buildRegistry(json,[oldRow],[],[]);
 assert.equal(rows.length,8);
 assert.equal(rows.filter(x=>x.name==='JB Baptiste').length,0);
 assert.ok(rows.some(x=>x.name==='PAP Piscine'));
 assert.ok(rows.some(x=>x.name==='SODIOR BTP'));
 assert.ok(rows.some(x=>x.name==='MANÉ & GNING'));
});


test('DIGIY SOLAIRE is a distinct trade module, not an electrician or a named artisan',()=>{
 const pros=API.buildRegistry(json);
 assert.equal(pros.length,8,'Eight people remain unchanged');
 assert.ok(!pros.some(x=>x.name==='JB Baptiste'), 'Legacy JB stays quarantined');
 const modules=API.buildModules(json);
 assert.equal(modules.length,1,'One validated solar module');
 const solar=modules[0];
 assert.equal(solar.name,'DIGIY SOLAIRE');
 assert.equal(solar.id,'digiy-solaire');
 assert.equal(solar.kind,'module','Module must not masquerade as a published artisan');
 assert.equal(solar.department,'solaire');
 assert.equal(solar.url,'https://digiy-solaire.digiylyfe.com/');
 assert.ok(solar.services.length>=3);
 assert.ok(!pros.some(x=>x.url===solar.url),'Solar destination is not duplicated as an artisan');
});

test('Solar always classifies as solar even when a legacy sector says electrical',()=>{
 assert.equal(API.tradeFor({department_id:'solaire',trade:'Installation électrique'}),'solaire');
 assert.equal(API.tradeFor({department_id:'electricite',trade:'Installation solaire photovoltaïque'}),'solaire');
 assert.equal(API.tradeFor({department_id:'electricite',trade:'Dépannage électrique'}),'electricite');
 assert.equal(API.tradeFor({sector:'électricité',trade:'Diagnostic batteries solaires'}),'solaire');
 assert.equal(API.tradeFor({department_id:'electricite',trade:'Électricien'}),'electricite');
 assert.ok(API.DEPTS.includes('solaire'));
 assert.notEqual(API.DEPTS.indexOf('solaire'),API.DEPTS.indexOf('electricite'));
});

test('Solar category exists in all ten public languages without changing existing eight profiles',()=>{
 for(const l of API.LANGS){
  assert.equal(API.WORDS[l].trades.length,9,l);
  assert.ok(API.WORDS[l].trades[7],l+' solar translated');
  assert.ok(API.WORDS[l].module,l+' module badge');
  assert.ok(API.WORDS[l].modules,l+' plural module label');
 }
 const listing=fs.readFileSync(path.join(root,'listing.html'),'utf8');
 assert.match(listing,/metier/);
 assert.match(script,/const moduleCount=list\.filter\(p=>p\.kind==="module"\)\.length/);
 assert.match(script,/const artisanCount=list\.filter\(p=>p\.kind!=="module"\)\.length/);
 assert.match(script,/buildModules\(seed\)/);
 const solar=API.buildModules(json)[0];
 assert.equal(solar.url,'https://digiy-solaire.digiylyfe.com/');
});

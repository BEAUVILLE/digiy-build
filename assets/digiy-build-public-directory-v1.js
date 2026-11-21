/* DIGIY BUILD — répertoire public partagé V1
 * Sources: artisans.json (publication explicite) + profils publics Supabase (RLS).
 * Jamais de déduction d'une adhésion payée depuis is_active/is_published.
 * Aucun accès propriétaire ni écriture en base.
 */
(function(root){
"use strict";
if(root.DIGIY_BUILD_DIRECTORY_V1)return;

const LANGS=["fr","wo","zh","en","es","pt","it","de","nl","ar"];
const API="https://wesqmwjjtsefyjnluosj.supabase.co/rest/v1/";
const API_KEY="sb_publishable_tGHItRgeWDmGjnd0CK1DVQ_BIep4Ug3";
const WORDS={
fr:{title:"Tous les professionnels publiés",lead:"Bâtiment, entretien, piscine et métiers du terrain · contact direct · 0 % commission",search:"Rechercher un nom ou un métier",all:"Tous les métiers",open:"Voir la fiche",contact:"WhatsApp direct",published:"Publié dans BUILD",partner:"Partenaire DIGIY",guest:"Invité DIGIY",count:"professionnels",none:"Aucun résultat pour cette recherche.",return:"Retour à DIGIYLYFE",trades:["Plomberie","Électricité","Construction","Peinture","Nettoyage","Piscines & jardins","Ingénierie & BTP","Autres métiers"]},
wo:{title:"Boroom liggéey yi ñu siiwal",lead:"Tabax, setal, piscine ak liggéeyu terrain · jokkoo bu jub · 0 % commission",search:"Seet tur walla métier",all:"Liggéey yépp",open:"Xool fiche bi",contact:"Jokkoo ci WhatsApp",published:"Ñu siiwal ci BUILD",partner:"Partaneeru DIGIY",guest:"Ganu DIGIY",count:"boroom liggéey",none:"Amul ku méngoo ak sa seet.",return:"Dellu ci DIGIYLYFE",trades:["Plomberie","Elektrisite","Tabax","Pentir","Setal","Piscine ak tool","Inseñeri ak BTP","Yeneen métier"]},
zh:{title:"所有已公开的专业人士",lead:"建筑、维护、泳池及现场服务 · 直接联系 · 0% 佣金",search:"搜索姓名或工种",all:"全部工种",open:"查看资料",contact:"WhatsApp 直接联系",published:"BUILD 已发布",partner:"DIGIY 合作伙伴",guest:"DIGIY 嘉宾",count:"位专业人士",none:"没有符合条件的结果。",return:"返回 DIGIYLYFE",trades:["管道维修","电气","建筑施工","油漆","清洁","泳池与园艺","工程与建筑","其他工种"]},
en:{title:"All published professionals",lead:"Construction, maintenance, pools and field services · direct contact · 0% commission",search:"Search by name or trade",all:"All trades",open:"Open profile",contact:"Direct WhatsApp",published:"Published on BUILD",partner:"DIGIY partner",guest:"DIGIY guest",count:"professionals",none:"No matching professionals.",return:"Back to DIGIYLYFE",trades:["Plumbing","Electrical","Construction","Painting","Cleaning","Pools & gardens","Engineering & building","Other trades"]},
es:{title:"Todos los profesionales publicados",lead:"Construcción, mantenimiento, piscinas y servicios · contacto directo · 0 % comisión",search:"Buscar nombre u oficio",all:"Todos los oficios",open:"Ver ficha",contact:"WhatsApp directo",published:"Publicado en BUILD",partner:"Colaborador DIGIY",guest:"Invitado DIGIY",count:"profesionales",none:"No se encontraron profesionales.",return:"Volver a DIGIYLYFE",trades:["Fontanería","Electricidad","Construcción","Pintura","Limpieza","Piscinas y jardines","Ingeniería y obras","Otros oficios"]},
pt:{title:"Todos os profissionais publicados",lead:"Construção, manutenção, piscinas e serviços locais · contacto direto · 0 % comissão",search:"Procurar nome ou profissão",all:"Todas as profissões",open:"Ver perfil",contact:"WhatsApp direto",published:"Publicado no BUILD",partner:"Parceiro DIGIY",guest:"Convidado DIGIY",count:"profissionais",none:"Nenhum profissional encontrado.",return:"Voltar ao DIGIYLYFE",trades:["Canalização","Eletricidade","Construção","Pintura","Limpeza","Piscinas e jardins","Engenharia e obras","Outras profissões"]},
it:{title:"Tutti i professionisti pubblicati",lead:"Edilizia, manutenzione, piscine e servizi locali · contatto diretto · 0% commissioni",search:"Cerca nome o mestiere",all:"Tutti i mestieri",open:"Apri scheda",contact:"WhatsApp diretto",published:"Pubblicato su BUILD",partner:"Partner DIGIY",guest:"Ospite DIGIY",count:"professionisti",none:"Nessun risultato.",return:"Torna a DIGIYLYFE",trades:["Idraulica","Elettricità","Edilizia","Pittura","Pulizie","Piscine e giardini","Ingegneria e costruzioni","Altri mestieri"]},
de:{title:"Alle veröffentlichten Fachkräfte",lead:"Bau, Wartung, Pools und Dienstleistungen · direkter Kontakt · 0 % Provision",search:"Name oder Handwerk suchen",all:"Alle Gewerke",open:"Profil öffnen",contact:"Direkt per WhatsApp",published:"Auf BUILD veröffentlicht",partner:"DIGIY Partner",guest:"DIGIY Gast",count:"Fachkräfte",none:"Keine passenden Fachkräfte.",return:"Zurück zu DIGIYLYFE",trades:["Sanitär","Elektrik","Bau","Malerei","Reinigung","Pools und Gärten","Ingenieurwesen und Bau","Weitere Gewerke"]},
nl:{title:"Alle gepubliceerde vakmensen",lead:"Bouw, onderhoud, zwembaden en lokale diensten · direct contact · 0% commissie",search:"Zoek naam of vak",all:"Alle vakken",open:"Open profiel",contact:"Direct WhatsApp",published:"Gepubliceerd op BUILD",partner:"DIGIY partner",guest:"DIGIY gast",count:"vakmensen",none:"Geen passende professionals.",return:"Terug naar DIGIYLYFE",trades:["Loodgieterswerk","Elektriciteit","Bouw","Schilderwerk","Schoonmaak","Zwembaden en tuinen","Techniek en bouw","Andere vakken"]},
ar:{title:"جميع المهنيين المنشورين",lead:"البناء والصيانة والمسابح والخدمات الميدانية · اتصال مباشر · عمولة صفر",search:"البحث بالاسم أو المهنة",all:"جميع المهن",open:"عرض الملف",contact:"واتساب مباشر",published:"منشور على BUILD",partner:"شريك DIGIY",guest:"ضيف DIGIY",count:"مهنيون",none:"لا توجد نتائج مطابقة.",return:"العودة إلى DIGIYLYFE",trades:["السباكة","الكهرباء","البناء","الدهان","التنظيف","المسابح والحدائق","الهندسة والبناء","مهن أخرى"]}
};
const DEPTS=["plomberie","electricite","construction","peinture","nettoyage","piscine","ingenierie","autres"];
const ICONS={plomberie:"🔧",electricite:"⚡",construction:"🧱",peinture:"🎨",nettoyage:"🧹",piscine:"💧",ingenierie:"🏗️",autres:"🛠️"};
function norm(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
function safeUrl(value){try{const u=new URL(String(value||""),"https://build.digiylyfe.com/");if(u.protocol!=="https:"&&u.protocol!=="http:")return"";return u.href;}catch(_){return"";}}
function urlKey(value){const safe=safeUrl(value);if(!safe)return"";const u=new URL(safe);let suffix=u.pathname.replace(/\/+$/,"")||"/";if(suffix.endsWith("/fiche.html"))suffix+="?slug="+(u.searchParams.get("slug")||"");return u.hostname.toLowerCase()+suffix.toLowerCase();}
function tradeFor(item){
 const code=norm(item.department_id||"");
 if(code==="plomberie")return"plomberie";
 if(code==="electricite")return"electricite";
 if(["maconnerie batisseurs","construction","maconnerie"].includes(code))return"construction";
 if(code==="peinture"||code==="peintre")return"peinture";
 if(code==="nettoyage")return"nettoyage";
 if(code==="piscine")return"piscine";
 if(code==="ingenierie")return"ingenierie";
 const t=norm([item.trade,item.activity_label,item.sector,item.specialite].join(" "));
 if(/piscin|jardin/.test(t))return"piscine";
 if(/peint|etanche/.test(t))return"peinture";
 if(/nettoy|menage|blanchiss/.test(t))return"nettoyage";
 if(/ingenier|etudes|bureau d etudes|terrass|immobilier|btp/.test(t))return"ingenierie";
 if(/elect|solaire/.test(t))return"electricite";
 if(/plomb|sanitair/.test(t))return"plomberie";
 if(/macon|batisseur|construction|renovation|villa/.test(t))return"construction";
 return"autres";
}
function makeProfile(item,kind,source){
 const name=String(item.name||item.display_name||"").trim();
 if(!name)return null;
 const services=Array.isArray(item.services)?item.services.map(x=>String(x?.nom||x)).filter(Boolean):[];
 const areas=Array.isArray(item.service_areas)?item.service_areas.map(String):[item.city,item.region,item.zone].filter(Boolean).map(String);
 const url=safeUrl(item.profile_url||item.public_url||item.website||item.fiche_url||"");
 if(!url)return null;
 const tel=String(item.phone_e164||item.phone||item.whatsapp_public||"").replace(/[^0-9]/g,"");
 const whatsapp=safeUrl(item.whatsapp_url||(tel?"https://wa.me/"+tel:""));
 return{id:String(item.id||item.slug||name),name,trade:String(item.trade||item.activity_label||""),department:tradeFor(item),areas,services,url,image:safeUrl(item.image||item.photo_url||item.card_url||""),whatsapp:whatsapp.startsWith("https://wa.me/")?whatsapp:"",kind,source};
}
function buildRegistry(seed,buildRows=[],annuaireRows=[],professionalRows=[]){
 const profiles=[];
 function add(item,kind,source){
  const p=makeProfile(item,kind,source);
  if(!p)return;
  const duplicate=profiles.find(x=>norm(x.name)===norm(p.name)||(urlKey(x.url)&&urlKey(x.url)===urlKey(p.url)));
  if(duplicate){
   // Les URL canoniques et statuts validés localement gardent la priorité.
   if(!duplicate.image&&p.image)duplicate.image=p.image;
   if(!duplicate.whatsapp&&p.whatsapp)duplicate.whatsapp=p.whatsapp;
   if(!duplicate.trade&&p.trade)duplicate.trade=p.trade;
   if(!duplicate.areas.length&&p.areas.length)duplicate.areas=p.areas;
   return;
  }
  profiles.push(p);
 }
 (seed.active_artisans||[]).filter(x=>x.status==="active").forEach(x=>add(x,"published","build-json"));
 (seed.published_professionals||[]).filter(x=>x.status==="published").forEach(x=>add(x,"published","build-json"));
 (seed.partner_professionals||[]).filter(x=>x.status==="partner_published").forEach(x=>add(x,"partner","build-json"));
 (seed.guest_professionals||[]).filter(x=>x.status==="guest_published").forEach(x=>add(x,"guest","build-json"));
 buildRows.filter(x=>x.is_active===true&&x.is_published===true).forEach(x=>{
  const link="https://build.digiylyfe.com/fiche.html?slug="+encodeURIComponent(x.slug||x.slug_key||"");
  add({...x,name:x.display_name,department_id:x.sector,profile_url:link},"published","build-public");
 });
 annuaireRows.filter(x=>x.is_public===true&&x.is_active===true&&x.entry_type==="professional"&&["artisan","terrain","service-artisan"].includes(String(x.category||"").toLowerCase())).forEach(x=>{
  const kind=x.status==="invite"?"guest":x.status==="partenaire"?"partner":"published";
  add({...x,name:x.display_name,trade:x.activity_label,profile_url:x.public_url},""+kind,"annuaire-public");
 });
 professionalRows.filter(x=>x.is_published===true&&x.is_active===true&&String(x.category)==="service-artisan").forEach(x=>{
  add({...x,name:x.name,trade:x.category+" "+(x.description||""),image:x.card_url,profile_url:x.website},"published","professionals-public");
 });
 return profiles.sort((a,b)=>a.name.localeCompare(b.name,"fr"));
}
function currentLang(){
 let k="fr";try{k=(new URLSearchParams(root.location.search).get("lang")||"fr").toLowerCase().slice(0,2);}catch(_){}
 return LANGS.includes(k)?k:"fr";
}
function selectedTrade(){
 let key="all";try{key=new URLSearchParams(root.location.search).get("metier")||"all";}catch(_){}
 const aliases={plombier:"plomberie",electricien:"electricite",macon:"construction",entrepreneur:"construction",peintre:"peinture",jardin:"piscine",pisciniste:"piscine",nettoyeur:"nettoyage",btp:"ingenierie",solaire:"electricite"};
 return aliases[key]||key;
}
function node(tag,cls,value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;}
function canonicalLink(url,lang){
 const link=safeUrl(url);
 if(!link)return"";
 const u=new URL(link);
 if(u.hostname==="digiylyfe.com"||u.hostname.endsWith(".digiylyfe.com"))u.searchParams.set("lang",lang);
 return u.href;
}
function populate(rootEl,profiles,page){
 let lang=currentLang(),words=WORDS[lang],filter=selectedTrade(),query="";
 const main=document.querySelector("main");
 function render(){
  lang=currentLang();words=WORDS[lang];
  const list=profiles.filter(p=>(filter==="all"||p.department===filter)&&(!query||norm([p.name,p.trade,...p.services,...p.areas].join(" ")).includes(norm(query))));
  rootEl.replaceChildren();
  const head=node("div","digiyDirectoryHeader");
  head.appendChild(node("h2","digiyDirectoryTitle",words.title));
  head.appendChild(node("p","digiyDirectoryLead",words.lead));
  const count=node("p","digiyDirectoryCount",list.length+" "+words.count);
  count.setAttribute("aria-live","polite");head.appendChild(count);rootEl.appendChild(head);
  const controls=node("div","digiyDirectoryControls");
  const search=node("input","digiyDirectorySearch");search.type="search";search.placeholder=words.search;search.value=query;search.setAttribute("aria-label",words.search);
  search.addEventListener("input",()=>{query=search.value;render();const next=rootEl.querySelector(".digiyDirectorySearch");next?.focus();if(next?.setSelectionRange)next.setSelectionRange(query.length,query.length);});
  controls.appendChild(search);
  const select=node("select","digiyDirectorySelect");select.setAttribute("aria-label",words.all);
  [["all",words.all],...DEPTS.map((x,i)=>[x,ICONS[x]+" "+words.trades[i]])].forEach(([id,label])=>{
   const option=node("option","",label);option.value=id;option.selected=id===filter;select.appendChild(option);
  });
  select.addEventListener("change",()=>{filter=select.value;render();});
  controls.appendChild(select);rootEl.appendChild(controls);
  if(page!=="home"){
   const languages=node("nav","digiyDirectoryLanguages");languages.setAttribute("aria-label","Langues");
   LANGS.forEach(k=>{const b=node("button",k===lang?"active":"",k.toUpperCase());b.type="button";b.setAttribute("aria-pressed",String(k===lang));b.addEventListener("click",()=>{const u=new URL(root.location.href);u.searchParams.set("lang",k);root.history.replaceState(null,"",u);document.documentElement.lang=k==="zh"?"zh-CN":k;document.documentElement.dir=k==="ar"?"rtl":"ltr";render();});languages.appendChild(b);});
   rootEl.appendChild(languages);
  }
  const cards=node("div","digiyDirectoryCards");
  const statusWords={published:words.published,partner:words.partner,guest:words.guest};
  for(const p of list){
   const card=node("article","digiyDirectoryCard");card.dataset.directoryId=p.id;
   const imgBox=node("div","digiyDirectoryArt");
   if(p.image){const img=node("img");img.src=p.image;img.alt=p.name;img.loading="lazy";imgBox.appendChild(img);}
   else imgBox.appendChild(node("span","digiyDirectoryEmoji",ICONS[p.department]||"🛠️"));
   card.appendChild(imgBox);
   const body=node("div","digiyDirectoryBody");
   body.appendChild(node("span","digiyDirectoryBadge digiyDirectoryBadge-"+p.kind,statusWords[p.kind]||words.published));
   body.appendChild(node("h3","",p.name));
   const ti=DEPTS.indexOf(p.department);
   body.appendChild(node("p","digiyDirectoryTrade",(ti>=0?words.trades[ti]:p.trade)||(p.trade||"")));
   body.appendChild(node("p","digiyDirectoryPlace",p.areas.filter(Boolean).slice(0,3).join(" · ")));
   const actions=node("div","digiyDirectoryActions");
   const go=node("a","digiyDirectoryButton",words.open);go.href=canonicalLink(p.url,lang);go.rel="noopener noreferrer";actions.appendChild(go);
   if(p.whatsapp){const wa=node("a","digiyDirectoryButton digiyDirectoryWhatsApp",words.contact);wa.href=p.whatsapp;wa.target="_blank";wa.rel="noopener noreferrer";actions.appendChild(wa);}
   body.appendChild(actions);card.appendChild(body);cards.appendChild(card);
  }
  if(!list.length)cards.appendChild(node("p","digiyDirectoryEmpty",words.none));
  rootEl.appendChild(cards);
  if(page==="home"){
   const headerTitle=document.querySelector("main .section [data-i18n='title']");
   if(headerTitle)headerTitle.textContent="DIGIY BUILD · "+words.title;
   const sub=document.querySelector("header .sub");if(sub)sub.textContent=words.lead;
   const doctrine=document.querySelector("main .doctrine [data-i18n='doctrine']");
   if(doctrine)doctrine.textContent=words.lead+" · "+(lang==="fr"?"Le professionnel garde son diagnostic, son devis, ses tarifs, son paiement et sa relation client.":lang==="en"?"The professional retains control of quotes, prices, payments and customer relationships.":"DIGIYLYFE · 0 % commission");
  }
 }
 render();
 document.body.dataset.digiyDirectoryPage=page;
 if(page==="home")document.addEventListener("click",event=>{if(event.target.closest("#langs button"))root.setTimeout(render,0);});
 return{refresh(next){profiles=next;render();}};
}
async function readApi(table,query){
 const u=new URL(table,API);
 for(const [key,value] of Object.entries(query))u.searchParams.set(key,value);
 const r=await root.fetch(u.href,{headers:{apikey:API_KEY,Accept:"application/json"},cache:"no-store"});
 if(!r.ok)throw new Error(table+": "+r.status);
 const x=await r.json();return Array.isArray(x)?x:[];
}
async function run(){
 const pathname=root.location.pathname;
 const page=pathname.endsWith("/listing.html")?"listing":pathname.endsWith("/catalogue.html")?"catalogue":"home";
 const response=await root.fetch("/artisans.json?v=20261121-unified-public",{cache:"no-store"});
 if(!response.ok)throw new Error("Public directory data unavailable");
 const seed=await response.json();
 let host;
 if(page==="home"){
  const doctrine=document.querySelector("main .doctrine");if(!doctrine)return;
  host=node("section","digiyDirectory");doctrine.insertAdjacentElement("afterend",host);
 }else if(page==="listing"){
  const filters=document.getElementById("filters");if(!filters)return;
  host=node("section","digiyDirectory");filters.insertAdjacentElement("afterend",host);
 }else{
  const hero=document.querySelector("main .hero");if(!hero)return;
  host=node("section","digiyDirectory");hero.insertAdjacentElement("afterend",host);
 }
 host.id="digiyUnifiedDirectory";
 const control=populate(host,buildRegistry(seed),page);
 const results=await Promise.allSettled([
  readApi("digiy_build_public_profiles",{select:"slug,slug_key,display_name,trade,sector,region,city,is_published,is_active,photo_url",is_published:"eq.true",is_active:"eq.true"}),
  readApi("digiy_annuaire_public",{select:"display_name,activity_label,short_description,category,status,entry_type,public_url,is_public,is_active",entry_type:"eq.professional",is_public:"eq.true",is_active:"eq.true"}),
  readApi("professionals",{select:"name,slug,category,city,description,website,card_url,is_published,is_active",is_published:"eq.true",is_active:"eq.true",category:"eq.service-artisan"})
 ]);
 const payload=results.map(x=>x.status==="fulfilled"?x.value:[]);
 control.refresh(buildRegistry(seed,payload[0],payload[1],payload[2]));
}
root.DIGIY_BUILD_DIRECTORY_V1={buildRegistry,tradeFor,WORDS,LANGS};
if(typeof document!=="undefined"&&typeof root.fetch==="function"){
 const begin=()=>run().catch(e=>root.console?.warn?.("DIGIY BUILD unified directory fallback:",e));
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",begin,{once:true});else begin();
}
})(typeof window!=="undefined"?window:globalThis);

/* DIGIY BUILD — moteur inscription multilingue */
(() => {
"use strict";
if(window.__DIGIY_BUILD_INSCRIPTION_I18N__) return;
window.__DIGIY_BUILD_INSCRIPTION_I18N__ = true;

const SUPPORTED=["fr","en","es","de","it","nl","ar"];
const FLAGS={fr:"🇫🇷 FR",en:"🇬🇧 EN",es:"🇪🇸 ES",de:"🇩🇪 DE",it:"🇮🇹 IT",nl:"🇳🇱 NL",ar:"🌙 AR"};
const PACKS=window.DIGIY_BUILD_INSCRIPTION_PACKS||{};
let activeLang=readLanguage(),applying=false,scheduled=false;
const originals=new WeakMap();
let sortedKeys=[];

function pack(){return PACKS[activeLang]||{text:{},fixed:{},prefix:{},sms:{}}}
function refreshKeys(){sortedKeys=Object.keys(pack().text||{}).sort((a,b)=>b.length-a.length)}
function readLanguage(){
  try{
    const q=String(new URLSearchParams(location.search).get("lang")||"").toLowerCase();
    if(SUPPORTED.includes(q)) return q;
    const s=String(localStorage.getItem("digiy-lang")||"").toLowerCase();
    if(SUPPORTED.includes(s)) return s;
    const b=String(navigator.language||"fr").slice(0,2).toLowerCase();
    if(SUPPORTED.includes(b)) return b;
  }catch(_){}
  return "fr";
}
function normalize(v){return String(v||"").replace(/\s+/g," ").trim()}
function knownCore(core){
  if(!core) return false;
  if(activeLang==="fr") return false;
  const text=pack().text||{};
  return Object.prototype.hasOwnProperty.call(text,core)
    ||/^\d+ choix sélectionné(?:s)?$/.test(core)
    ||core.startsWith("Date de demande :")
    ||sortedKeys.some(k=>core.includes(k));
}
function translateCore(core){
  if(!core||activeLang==="fr") return core;
  const text=pack().text||{};
  if(text[core]) return text[core];

  const count=core.match(/^(\d+) choix sélectionné(s)?$/);
  if(count){
    const n=Number(count[1]);
    const labels={
      en:["option selected","options selected"],
      es:["opción seleccionada","opciones seleccionadas"],
      de:["Option ausgewählt","Optionen ausgewählt"],
      it:["opzione selezionata","opzioni selezionate"],
      nl:["optie geselecteerd","opties geselecteerd"],
      ar:["خيار محدد","خيارات محددة"]
    }[activeLang];
    return n+" "+labels[n===1?0:1];
  }

  if(core.startsWith("Date de demande :")){
    const rest=core.slice("Date de demande :".length).trim();
    const prefix={
      en:"Request date:",es:"Fecha de solicitud:",de:"Anfragedatum:",
      it:"Data della richiesta:",nl:"Aanvraagdatum:",ar:"تاريخ الطلب:"
    }[activeLang];
    return prefix+(rest?" "+rest:"");
  }

  let out=core;
  for(const key of sortedKeys){
    if(out.includes(key)&&text[key]) out=out.split(key).join(text[key]);
  }
  return out;
}
function parseOriginal(raw){
  const compact=normalize(raw);
  if(!compact) return null;
  const match=compact.match(/^([✅✔✓•·\-–—]\s*)(.+)$/);
  const prefix=match?match[1]:"";
  const core=match?normalize(match[2]):compact;
  if(!knownCore(core)) return null;
  return {raw:String(raw),compact,prefix,core};
}
function translateTextNode(node){
  if(!node||node.nodeType!==Node.TEXT_NODE) return;
  const parent=node.parentElement;
  if(parent&&/^(SCRIPT|STYLE|NOSCRIPT)$/i.test(parent.tagName)) return;

  if(!originals.has(node)){
    const original=parseOriginal(node.nodeValue);
    if(!original) return;
    originals.set(node,original);
  }
  const original=originals.get(node);
  const next=original.raw.replace(original.compact,original.prefix+translateCore(original.core));
  if(node.nodeValue!==next) node.nodeValue=next;
}
function translateAttributes(root){
  const elements=[];
  if(root&&root.nodeType===Node.ELEMENT_NODE) elements.push(root);
  (root||document).querySelectorAll?.("[placeholder],[aria-label],[title]").forEach(el=>elements.push(el));

  for(const el of elements){
    for(const attr of ["placeholder","aria-label","title"]){
      if(!el.hasAttribute?.(attr)) continue;
      const key="buildOriginal"+attr[0].toUpperCase()+attr.slice(1);
      let original=el.dataset[key];
      if(!original){
        const current=normalize(el.getAttribute(attr));
        if(!knownCore(current)) continue;
        original=current;
        el.dataset[key]=current;
      }
      const translated=translateCore(original);
      if(el.getAttribute(attr)!==translated) el.setAttribute(attr,translated);
    }
  }
}
function walk(root){
  if(!root) return;
  if(root.nodeType===Node.TEXT_NODE){translateTextNode(root);return;}
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())) translateTextNode(node);
}
function ensureBar(){
  if(document.getElementById("build-inscription-language-bar")) return;
  const header=document.querySelector(".top");
  if(!header) return;

  const style=document.createElement("style");
  style.id="build-inscription-language-style";
  style.textContent='#build-inscription-language-bar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;width:100%;order:3}#build-inscription-language-bar button{min-height:40px;padding:0 6px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#fff;font-size:12px;font-weight:1000;cursor:pointer}#build-inscription-language-bar button.active{background:linear-gradient(135deg,#f97316,#facc15);color:#061b14;border-color:transparent}html[dir="rtl"] body{text-align:right}html[dir="rtl"] .option{text-align:right}@media(max-width:700px){#build-inscription-language-bar{grid-template-columns:repeat(4,minmax(0,1fr))}}';
  document.head.appendChild(style);

  const bar=document.createElement("div");
  bar.id="build-inscription-language-bar";
  bar.setAttribute("aria-label","Choisir la langue");
  for(const code of SUPPORTED){
    const button=document.createElement("button");
    button.type="button";
    button.dataset.lang=code;
    button.textContent=FLAGS[code];
    button.addEventListener("click",()=>setLanguage(code));
    bar.appendChild(button);
  }
  header.appendChild(bar);
}
function setLanguage(code){
  if(!SUPPORTED.includes(code)) return;
  activeLang=code;
  refreshKeys();
  try{
    localStorage.setItem("digiy-lang",code);
    const url=new URL(location.href);
    url.searchParams.set("lang",code);
    history.replaceState(null,"",url);
  }catch(_){}
  apply(document);
  document.dispatchEvent(new CustomEvent("digiy:languagechange",{detail:{lang:code}}));
}
function updateDocument(){
  document.documentElement.lang=activeLang;
  document.documentElement.dir=activeLang==="ar"?"rtl":"ltr";
  if(activeLang!=="fr"&&pack().title) document.title=pack().title;
  document.querySelectorAll("#build-inscription-language-bar button").forEach(button=>{
    button.classList.toggle("active",button.dataset.lang===activeLang);
    button.setAttribute("aria-pressed",button.dataset.lang===activeLang?"true":"false");
  });
}
function translateMessage(message){
  if(activeLang==="fr") return message;
  const current=pack(),fixed=current.fixed||{},prefixes=current.prefix||{};
  return String(message||"").split("\n").map(line=>{
    const compact=normalize(line);
    if(!compact) return "";
    if(fixed[compact]) return fixed[compact];
    for(const [prefix,next] of Object.entries(prefixes)){
      if(compact.startsWith(prefix)){
        const rest=compact.slice(prefix.length).trim();
        return next+(rest?" "+translateCore(rest):"");
      }
    }
    return translateCore(compact);
  }).join("\n");
}
function translateWhatsApp(){
  for(const id of ["btnWa","btnProof"]){
    const link=document.getElementById(id);
    if(!link||!link.href) continue;
    try{
      const url=new URL(link.href);
      const current=url.searchParams.get("text")||"";
      if(!current) continue;
      if(/^(Bonjour JB|DEMANDE DIGIY BUILD)/.test(current)||!link.dataset.buildOriginalMessage){
        link.dataset.buildOriginalMessage=current;
      }
      const original=link.dataset.buildOriginalMessage||current;
      const next=activeLang==="fr"?original:translateMessage(original);
      if(next!==current){
        url.searchParams.set("text",next);
        link.href=url.toString();
      }
    }catch(_){}
  }
}
function validSms(){
  const fields=["proName","proPhone","proZone","proActivity"].map(id=>document.getElementById(id)).filter(Boolean);
  if(fields.some(field=>!String(field.value||"").trim()||!field.checkValidity())) return false;
  const codes=Array.from(document.querySelectorAll(".option.active")).map(el=>el.dataset.code);
  if(!codes.some(code=>["B1","B2","B3","FIRST"].includes(code))) return false;
  const country=document.querySelector("[data-country].active")?.dataset.country||"senegal";
  return !(country==="france"&&codes.some(code=>["E1","E2","E3"].includes(code)));
}
function localizedSms(){
  const sms=pack().sms||{};
  const codes=Array.from(document.querySelectorAll(".option.active")).map(el=>el.dataset.code).filter(Boolean);
  const country=document.querySelector("[data-country].active")?.dataset.country||"senegal";
  const total=normalize(document.getElementById("totalText")?.textContent||"");
  const note=normalize(document.getElementById("paymentNote")?.value||"");
  const value=id=>normalize(document.getElementById(id)?.value||"");

  return [
    sms.title,
    sms.country+": "+(country==="france"?sms.france:sms.senegal),
    sms.choice+": "+codes.join(" + "),
    sms.total+": "+total,
    sms.name+": "+value("proName"),
    sms.phone+": "+value("proPhone"),
    sms.zone+": "+value("proZone"),
    sms.activity+": "+value("proActivity"),
    note?sms.note+": "+note:"",
    sms.request,
    sms.zero
  ].filter(Boolean).join("\n");
}
function bindSms(){
  const button=document.getElementById("btnSms");
  if(!button||button.dataset.buildI18nSms) return;
  button.dataset.buildI18nSms="1";
  button.addEventListener("click",event=>{
    if(activeLang==="fr"||!validSms()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    location.href="sms:+221771342889"+(ios?"&":"?")+"body="+encodeURIComponent(localizedSms());
  },true);
}
function apply(root){
  if(applying) return;
  applying=true;
  try{
    ensureBar();
    walk(root||document.body);
    translateAttributes(root||document);
    updateDocument();
    translateWhatsApp();
    bindSms();
  }finally{
    applying=false;
  }
}
function schedule(){
  if(scheduled) return;
  scheduled=true;
  setTimeout(()=>{scheduled=false;apply(document.body)},30);
}
function init(){
  refreshKeys();
  apply(document);
  new MutationObserver(schedule).observe(document.documentElement,{
    childList:true,subtree:true,attributes:true,attributeFilter:["href","placeholder","aria-label","title"]
  });
  setTimeout(schedule,160);
  setTimeout(schedule,700);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();

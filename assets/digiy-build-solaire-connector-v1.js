/* DIGIY BUILD — CONNECTEUR ACTIF DIGIY SOLAIRE V1
 * Validation humaine : 29 août 2026.
 * DIGIY SOLAIRE existe déjà comme module métier actif : ce n'est jamais une PLACE À PRENDRE.
 */
(function(){
  'use strict';
  if(window.DIGIY_BUILD_SOLAIRE_CONNECTOR_V1)return;
  window.DIGIY_BUILD_SOLAIRE_CONNECTOR_V1=true;

  var URL_SOLAR='https://digiy-solaire.digiylyfe.com/';
  var T={
    fr:{status:'MODULE ACTIF',open:'OUVRIR',desc:'Installation · dépannage · batterie · entretien'},
    en:{status:'ACTIVE MODULE',open:'OPEN',desc:'Installation · repairs · battery · maintenance'},
    es:{status:'MÓDULO ACTIVO',open:'ABRIR',desc:'Instalación · reparación · batería · mantenimiento'},
    pt:{status:'MÓDULO ATIVO',open:'ABRIR',desc:'Instalação · reparação · bateria · manutenção'},
    it:{status:'MODULO ATTIVO',open:'APRI',desc:'Installazione · riparazione · batteria · manutenzione'},
    de:{status:'AKTIVES MODUL',open:'ÖFFNEN',desc:'Installation · Reparatur · Batterie · Wartung'},
    nl:{status:'ACTIEVE MODULE',open:'OPENEN',desc:'Installatie · reparatie · accu · onderhoud'},
    ar:{status:'وحدة نشطة',open:'فتح',desc:'تركيب · إصلاح · بطارية · صيانة'}
  };

  function lang(){
    var q='';try{q=(new URLSearchParams(location.search).get('lang')||'').slice(0,2).toLowerCase();}catch(e){}
    var h=(document.documentElement.lang||'fr').slice(0,2).toLowerCase();
    return T[q]?q:(T[h]?h:'fr');
  }
  function style(){
    if(document.getElementById('digiyBuildSolarStyle'))return;
    var s=document.createElement('style');s.id='digiyBuildSolarStyle';s.textContent='\
.digiyBuildSolarDoor{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;margin-bottom:9px;padding:9px 10px;border:1px solid rgba(250,204,21,.58);border-radius:14px;background:linear-gradient(135deg,rgba(250,204,21,.18),rgba(34,197,94,.13));color:#fff;text-decoration:none}.digiyBuildSolarIcon{font-size:25px}.digiyBuildSolarText strong{display:block;color:#fff3b0;font-size:10px}.digiyBuildSolarText span{display:block;margin-top:2px;color:#fff;font-size:10px;font-weight:1000}.digiyBuildSolarText small{display:block;margin-top:2px;color:rgba(255,255,255,.72);font-size:8px;font-weight:800}.digiyBuildSolarOpen{padding:6px 8px;border-radius:999px;background:#facc15;color:#082112;font-size:8px;font-weight:1000;white-space:nowrap}\
';document.head.appendChild(s);
  }
  function render(){
    style();
    var box=document.getElementById('digiyBuildOpenConnectors');
    if(!box)return false;
    var x=T[lang()]||T.fr;
    var a=document.getElementById('digiyBuildSolarDoor');
    if(!a){a=document.createElement('a');a.id='digiyBuildSolarDoor';a.className='digiyBuildSolarDoor';a.href=URL_SOLAR;box.insertBefore(a,box.firstChild);}
    a.innerHTML='<span class="digiyBuildSolarIcon">☀️</span><span class="digiyBuildSolarText"><strong>'+x.status+'</strong><span>DIGIY SOLAIRE</span><small>'+x.desc+'</small></span><span class="digiyBuildSolarOpen">'+x.open+' →</span>';
    return true;
  }
  var tries=0,timer=setInterval(function(){tries++;if(render()||tries>40)clearInterval(timer);},150);
  try{new MutationObserver(function(){render();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});}catch(e){}
})();
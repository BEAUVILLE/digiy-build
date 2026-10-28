(()=>{
  'use strict';
  const SUP=['fr','en','es','pt','de','it','nl','ar'];
  const COPY={
    fr:{main:'🧰 ADHÉSION BUILD · OFFRE UNIQUE',prices:'📦 Voir adhésion BUILD'},
    en:{main:'🧰 BUILD MEMBERSHIP · ONE PLAN',prices:'📦 View BUILD membership'},
    es:{main:'🧰 BUILD · UNA CUOTA',prices:'📦 Ver adhesión BUILD'},
    pt:{main:'🧰 BUILD · ADESÃO ÚNICA',prices:'📦 Ver adesão BUILD'},
    de:{main:'🧰 BUILD · EIN TARIF',prices:'📦 BUILD-Mitgliedschaft ansehen'},
    it:{main:'🧰 BUILD · UN SOLO PIANO',prices:'📦 Vedi adesione BUILD'},
    nl:{main:'🧰 BUILD · ÉÉN TARIEF',prices:'📦 Bekijk BUILD-lidmaatschap'},
    ar:{main:'🧰 BUILD · اشتراك واحد',prices:'📦 عرض اشتراك BUILD'}
  };
  function lang(){
    try{
      const q=(new URLSearchParams(location.search).get('lang')||'').slice(0,2).toLowerCase();
      if(SUP.includes(q))return q;
      const s=(localStorage.getItem('digiy-lang')||'').slice(0,2).toLowerCase();
      if(SUP.includes(s))return s;
    }catch(_){ }
    return 'fr';
  }
  function apply(){
    const l=lang(),t=COPY[l]||COPY.fr;
    const u='https://build.digiylyfe.com/inscription-lang.html?lang='+encodeURIComponent(l);
    const signup=document.getElementById('signupLink');
    const prices=document.getElementById('pricesLink');
    if(signup){signup.href=u;signup.textContent=t.main;signup.setAttribute('aria-label',t.main);}
    if(prices){prices.href=u;prices.textContent=t.prices;prices.setAttribute('aria-label',t.prices);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0),{once:true});
  else setTimeout(apply,0);
})();
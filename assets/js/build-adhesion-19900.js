(()=>{
  'use strict';
  const SUP=['fr','en','es','pt','de','it','nl','ar'];
  const COPY={
    fr:{main:'💳 ADHÉSION BUILD · 19 900 FCFA / mois',prices:'📦 Voir l’adhésion · 19 900 FCFA'},
    en:{main:'💳 BUILD MEMBERSHIP · 19,900 FCFA / month',prices:'📦 View membership · 19,900 FCFA'},
    es:{main:'💳 ADHESIÓN BUILD · 19.900 FCFA / mes',prices:'📦 Ver adhesión · 19.900 FCFA'},
    pt:{main:'💳 ADESÃO BUILD · 19 900 FCFA / mês',prices:'📦 Ver adesão · 19 900 FCFA'},
    de:{main:'💳 BUILD-MITGLIEDSCHAFT · 19.900 FCFA / Monat',prices:'📦 Mitgliedschaft ansehen · 19.900 FCFA'},
    it:{main:'💳 ADESIONE BUILD · 19.900 FCFA / mese',prices:'📦 Vedi adesione · 19.900 FCFA'},
    nl:{main:'💳 BUILD-LIDMAATSCHAP · 19.900 FCFA / maand',prices:'📦 Bekijk lidmaatschap · 19.900 FCFA'},
    ar:{main:'💳 اشتراك BUILD · 19,900 FCFA / شهر',prices:'📦 عرض الاشتراك · 19,900 FCFA'}
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
    const u='https://digiylyfe.com/tarifs-adherents-1.html?lang='+encodeURIComponent(l);
    const signup=document.getElementById('signupLink');
    const prices=document.getElementById('pricesLink');
    if(signup){signup.href=u;signup.textContent=t.main;signup.setAttribute('aria-label',t.main);}
    if(prices){prices.href=u;prices.textContent=t.prices;prices.setAttribute('aria-label',t.prices);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0),{once:true});
  else setTimeout(apply,0);
})();
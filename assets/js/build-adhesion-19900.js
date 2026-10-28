(()=>{
  'use strict';
  const SUP=['fr','en','es','pt','de','it','nl','ar'];
  const COPY={
    fr:{main:'🧰 FORMULES BUILD · B1 / B2 / B3',prices:'📦 Voir la grille BUILD · B1 / B2 / B3'},
    en:{main:'🧰 BUILD PLANS · B1 / B2 / B3',prices:'📦 See BUILD plans · B1 / B2 / B3'},
    es:{main:'🧰 PLANES BUILD · B1 / B2 / B3',prices:'📦 Ver planes BUILD · B1 / B2 / B3'},
    pt:{main:'🧰 PLANOS BUILD · B1 / B2 / B3',prices:'📦 Ver planos BUILD · B1 / B2 / B3'},
    de:{main:'🧰 BUILD-TARIFE · B1 / B2 / B3',prices:'📦 BUILD-Tarife ansehen · B1 / B2 / B3'},
    it:{main:'🧰 PIANI BUILD · B1 / B2 / B3',prices:'📦 Vedi piani BUILD · B1 / B2 / B3'},
    nl:{main:'🧰 BUILD-PAKKETTEN · B1 / B2 / B3',prices:'📦 Bekijk BUILD-pakketten · B1 / B2 / B3'},
    ar:{main:'🧰 باقات BUILD · B1 / B2 / B3',prices:'📦 عرض باقات BUILD · B1 / B2 / B3'}
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
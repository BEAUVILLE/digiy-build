/* DIGIY BUILD — vrai pack multilingue */
(function(){'use strict';
var D=window.DIGIY_BUILD_PACK_DATA;if(!D)return;
var SUP=['fr','en','es','de','it','nl','ar'];
function lang(){try{if(window.DIGIY_I18N)return window.DIGIY_I18N.getLanguage();var q=new URL(location.href).searchParams.get('lang');if(SUP.includes(q))return q;var s=localStorage.getItem('digiy-lang');if(SUP.includes(s))return s;}catch(e){}return'fr';}
function packs(){var p={};Object.keys(D.rows).forEach(function(l){var x={};Object.keys(D.fr).forEach(function(k){x[D.fr[k]]=D.rows[l][k];x[D.en[k]]=D.rows[l][k];});p[l]=x;});return p;}
function register(){if(window.DIGIY_I18N)window.DIGIY_I18N.register(packs());}
function buttons(){var bar=document.querySelector('.lang-switch');if(!bar||bar.dataset.seven)return;bar.dataset.seven='1';[['es','ES'],['de','DE'],['it','IT'],['nl','NL'],['ar','AR']].forEach(function(v){var b=document.createElement('button');b.type='button';b.dataset.lang=v[0];b.textContent=v[1];b.addEventListener('click',function(){window.DIGIY_I18N&&window.DIGIY_I18N.setLanguage(v[0]);});bar.appendChild(b);});}
function patch(){var l=lang();document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';buttons();document.querySelectorAll('.lang-switch button').forEach(function(b){var x=b.dataset.lang||(b.id==='langFr'?'fr':b.id==='langEn'?'en':'');b.classList.toggle('active',x===l);});if(D.meta[l]){document.title=D.meta[l].title;var f=document.querySelector('footer.wrap');if(f)f.textContent=D.meta[l].footer;var ts=document.querySelectorAll('.trade-list .trade'),a=D.trades[l]||[];ts.forEach(function(n,i){if(a[i])n.textContent=a[i];});document.querySelectorAll('a[href*="wa.me/"]').forEach(function(a){try{var u=new URL(a.href),m=D.meta[l].wa+(u.pathname.indexOf('336')>=0?' France.':'');u.searchParams.set('text',m);a.href=u.toString();}catch(e){}});} }
document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('#langFr,#langEn'):null;if(b&&window.DIGIY_I18N)window.DIGIY_I18N.setLanguage(b.id==='langEn'?'en':'fr');},true);
document.addEventListener('digiy:languagechange',function(){setTimeout(patch,0);});
function init(){register();patch();new MutationObserver(function(){setTimeout(patch,0);}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
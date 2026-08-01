/* DIGIY BUILD — conserve la langue vers l'inscription publique */
(() => {
  "use strict";
  const SUPPORTED = ["fr","en","es","de","it","nl","ar"];

  function currentLang(){
    try{
      const query = String(new URLSearchParams(location.search).get("lang") || "").toLowerCase();
      if(SUPPORTED.includes(query)) return query;
      const stored = String(localStorage.getItem("digiy-lang") || "").toLowerCase();
      if(SUPPORTED.includes(stored)) return stored;
    }catch(_){}
    return "fr";
  }

  function rewrite(anchor){
    try{
      const raw = anchor.getAttribute("href");
      if(!raw || /^(mailto:|tel:|sms:|javascript:|#)/i.test(raw)) return;
      const target = new URL(raw,location.href);
      if(!/\/inscription-build\.html$/i.test(target.pathname)) return;

      const wrapper = new URL("./inscription-lang.html",location.href);
      target.searchParams.forEach((value,key) => {
        if(key !== "lang" && key !== "v") wrapper.searchParams.set(key,value);
      });
      wrapper.searchParams.set("lang",currentLang());
      if(target.hash) wrapper.hash = target.hash;
      anchor.setAttribute("href",wrapper.toString());
    }catch(_){}
  }

  function apply(root){
    if(root && root.matches?.("a[href]")) rewrite(root);
    (root || document).querySelectorAll?.("a[href]").forEach(rewrite);
  }

  function start(){
    apply(document);
    new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if(node.nodeType === Node.ELEMENT_NODE) apply(node);
        });
      });
    }).observe(document.documentElement,{subtree:true,childList:true});
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }
})();

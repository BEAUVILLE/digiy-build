/* DIGIY BUILD — Europe remplace France dans la porte d'inscription */
(() => {
  "use strict";
  if (window.__DIGIY_BUILD_INSCRIPTION_EUROPE__) return;
  window.__DIGIY_BUILD_INSCRIPTION_EUROPE__ = true;

  const LANGS = ["fr", "en", "es", "de", "it", "nl", "ar"];
  const LABELS = {
    fr: {
      country: "Europe",
      sms: {
        title: "DEMANDE DIGIY BUILD",
        country: "Zone",
        choice: "Choix",
        total: "Total",
        name: "Nom / responsable",
        phone: "Téléphone candidat",
        zone: "Zone / ville",
        activity: "Métier / activité",
        note: "Note",
        request: "Je demande à être recontacté pour valider mon activation BUILD.",
        zero: "0% commission DIGIY."
      }
    },
    en: {
      country: "Europe",
      sms: {
        title: "DIGIY BUILD REQUEST",
        country: "Area",
        choice: "Choice",
        total: "Total",
        name: "Name / manager",
        phone: "Applicant phone",
        zone: "Area / city",
        activity: "Trade / activity",
        note: "Note",
        request: "Please contact me to validate my BUILD activation.",
        zero: "0% DIGIY commission."
      }
    },
    es: {
      country: "Europa",
      sms: {
        title: "SOLICITUD DIGIY BUILD",
        country: "Zona",
        choice: "Elección",
        total: "Total",
        name: "Nombre / responsable",
        phone: "Teléfono del candidato",
        zone: "Zona / ciudad",
        activity: "Oficio / actividad",
        note: "Nota",
        request: "Solicito que me contacten para validar mi activación BUILD.",
        zero: "0% de comisión DIGIY."
      }
    },
    de: {
      country: "Europa",
      sms: {
        title: "DIGIY BUILD ANFRAGE",
        country: "Gebiet",
        choice: "Auswahl",
        total: "Gesamt",
        name: "Name / Verantwortlicher",
        phone: "Telefon",
        zone: "Gebiet / Stadt",
        activity: "Beruf / Tätigkeit",
        note: "Notiz",
        request: "Bitte kontaktieren Sie mich zur Bestätigung meiner BUILD-Aktivierung.",
        zero: "0% DIGIY-Provision."
      }
    },
    it: {
      country: "Europa",
      sms: {
        title: "RICHIESTA DIGIY BUILD",
        country: "Zona",
        choice: "Scelta",
        total: "Totale",
        name: "Nome / responsabile",
        phone: "Telefono",
        zone: "Zona / città",
        activity: "Mestiere / attività",
        note: "Nota",
        request: "Chiedo di essere ricontattato per convalidare la mia attivazione BUILD.",
        zero: "0% commissioni DIGIY."
      }
    },
    nl: {
      country: "Europa",
      sms: {
        title: "DIGIY BUILD AANVRAAG",
        country: "Regio",
        choice: "Keuze",
        total: "Totaal",
        name: "Naam / verantwoordelijke",
        phone: "Telefoon",
        zone: "Regio / stad",
        activity: "Vak / activiteit",
        note: "Notitie",
        request: "Neem contact met mij op om mijn BUILD-activering te bevestigen.",
        zero: "0% DIGIY-commissie."
      }
    },
    ar: {
      country: "أوروبا",
      sms: {
        title: "طلب DIGIY BUILD",
        country: "المنطقة",
        choice: "الاختيار",
        total: "الإجمالي",
        name: "الاسم / المسؤول",
        phone: "الهاتف",
        zone: "المنطقة / المدينة",
        activity: "المهنة / النشاط",
        note: "ملاحظة",
        request: "أطلب التواصل معي لتأكيد تفعيل BUILD.",
        zero: "عمولة DIGIY بنسبة 0%."
      }
    }
  };

  const WORDS = [
    [/🇫🇷\s*France/gi, "🇪🇺 Europe"],
    [/France/gi, "Europe"],
    [/france/gi, "europe"],
    [/Frankreich/g, "Europa"],
    [/frankreich/g, "europa"],
    [/Francia/g, "Europa"],
    [/francia/g, "europa"],
    [/Frankrijk/g, "Europa"],
    [/frankrijk/g, "europa"],
    [/فرنسا/g, "أوروبا"]
  ];

  function language() {
    let lang = String(document.documentElement.lang || "").slice(0, 2).toLowerCase();
    if (!LANGS.includes(lang)) {
      try { lang = String(localStorage.getItem("digiy-lang") || "").slice(0, 2).toLowerCase(); } catch (_) {}
    }
    return LANGS.includes(lang) ? lang : "fr";
  }

  function replaceWords(value) {
    let output = String(value || "");
    for (const [pattern, replacement] of WORDS) output = output.replace(pattern, replacement);
    return output;
  }

  function replaceTextNodes(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (parent && /^(SCRIPT|STYLE|NOSCRIPT)$/i.test(parent.tagName)) continue;
      const next = replaceWords(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  }

  function replaceAttributes(root) {
    const elements = [];
    if (root && root.nodeType === Node.ELEMENT_NODE) elements.push(root);
    (root || document).querySelectorAll?.("[placeholder],[aria-label],[title]").forEach((el) => elements.push(el));
    for (const el of elements) {
      for (const attr of ["placeholder", "aria-label", "title"]) {
        if (!el.hasAttribute(attr)) continue;
        const current = el.getAttribute(attr);
        const next = replaceWords(current);
        if (next !== current) el.setAttribute(attr, next);
      }
    }
  }

  function replaceMessageLinks(root) {
    const links = [];
    if (root && root.nodeType === Node.ELEMENT_NODE && root.matches?.("a[href]")) links.push(root);
    (root || document).querySelectorAll?.("a[href]").forEach((link) => links.push(link));
    for (const link of links) {
      try {
        const url = new URL(link.href, location.href);
        const text = url.searchParams.get("text");
        if (!text) continue;
        const next = replaceWords(text);
        if (next !== text) {
          url.searchParams.set("text", next);
          link.href = url.toString();
        }
      } catch (_) {}
    }
  }

  function refresh(root) {
    replaceTextNodes(root || document.body);
    replaceAttributes(root || document);
    replaceMessageLinks(root || document);

    const EuropeButton = document.querySelector('[data-country="france"]');
    if (EuropeButton) {
      const label = LABELS[language()]?.country || "Europe";
      EuropeButton.setAttribute("aria-label", label);
    }
  }

  function selectedEurope() {
    return document.querySelector('[data-country="france"].active') !== null;
  }

  function validForm() {
    const fields = ["proName", "proPhone", "proZone", "proActivity"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (fields.some((field) => !String(field.value || "").trim() || !field.checkValidity())) return false;
    const codes = Array.from(document.querySelectorAll(".option.active")).map((el) => el.dataset.code);
    return codes.some((code) => ["B1", "B2", "B3", "FIRST"].includes(code));
  }

  function localizedSms() {
    const lang = language();
    const pack = LABELS[lang] || LABELS.fr;
    const sms = pack.sms;
    const value = (id) => String(document.getElementById(id)?.value || "").replace(/\s+/g, " ").trim();
    const codes = Array.from(document.querySelectorAll(".option.active"))
      .map((el) => el.dataset.code)
      .filter(Boolean)
      .join(" + ");
    const total = String(document.getElementById("totalText")?.textContent || "").replace(/\s+/g, " ").trim();
    const note = value("paymentNote");

    return [
      sms.title,
      sms.country + ": " + pack.country,
      sms.choice + ": " + codes,
      sms.total + ": " + total,
      sms.name + ": " + value("proName"),
      sms.phone + ": " + value("proPhone"),
      sms.zone + ": " + value("proZone"),
      sms.activity + ": " + value("proActivity"),
      note ? sms.note + ": " + note : "",
      sms.request,
      sms.zero
    ].filter(Boolean).join("\n");
  }

  function bindSmsEurope() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest?.("#btnSms");
      if (!button || !selectedEurope() || !validForm()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      location.href = "sms:+221771342889" + (ios ? "&" : "?") + "body=" + encodeURIComponent(localizedSms());
    }, true);
  }

  function init() {
    refresh(document);
    bindSmsEurope();
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        refresh(document);
      }, 25);
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href", "placeholder", "aria-label", "title", "class"]
    });
    document.addEventListener("digiy:languagechange", () => setTimeout(() => refresh(document), 40));
    setTimeout(() => refresh(document), 180);
    setTimeout(() => refresh(document), 750);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

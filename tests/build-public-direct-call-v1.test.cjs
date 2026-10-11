"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const fiche = fs.readFileSync(path.join(root, "fiche.html"), "utf8");

test("annuaire Babacar : appel tel direct et parcours existants conserves", () => {
  assert.match(index, /href="tel:\+221776125124"[^>]*data-i18n="call"/);
  assert.match(index, /href="https:\/\/wa\.me\/221776125124"/);
  assert.match(index, /href="\.\/fiche\.html\?slug=babacar-plombier-pro"/);
});

test("annuaire : appel traduit en huit langues", () => {
  const match = index.match(/const T = (\{[^\n]+\});/);
  assert.ok(match, "dictionnaire BUILD attendu");
  const dictionary = JSON.parse(match[1]);
  const langs = ["fr", "en", "es", "pt", "it", "de", "nl", "ar"];
  for (const lang of langs) {
    assert.ok(dictionary[lang]?.call?.includes("Babacar"), lang);
  }
});

test("fiche : appel distinct du formulaire et de WhatsApp, cache sans telephone", () => {
  assert.match(fiche, /id="directCallBtn"[^>]*hidden/);
  assert.match(fiche, /\.actions a\[hidden\]\{display:none\}/);
  assert.match(fiche, /directCall\.hidden = !directPhone/);
  assert.match(fiche, /directCall\.removeAttribute\("href"\)/);
  assert.match(fiche, /\$\("callBtn"\)\.href = requestUrl/);
  assert.match(fiche, /\$\("bottomNeed"\)\.href = requestUrl/);
  assert.match(fiche, /\$\("waBtn"\)\.href = wa/);
});

test("appel : uniquement numero de telephone public explicite, sans repli WhatsApp", () => {
  const match = fiche.match(/      function phoneCallUrl\(profile\)\{[\s\S]*?\n      \}/);
  assert.ok(match, "fonction phoneCallUrl attendue");
  const setup = [
    'function text(v){return String(v ?? "").trim();}',
    'function normalizePhone(v){return String(v || "").replace(/[^0-9]/g, "");}',
    match[0],
    'phoneCallUrl'
  ].join("\n");
  const callUrl = vm.runInNewContext(setup);
  assert.equal(callUrl({phone: "+221 77 612 51 24", whatsapp: "221776125124"}), "tel:+221776125124");
  assert.equal(callUrl({phone: "221776125124"}), "tel:+221776125124");
  assert.equal(callUrl({whatsapp: "221776125124"}), "");
  assert.equal(callUrl({phone: ""}), "");
  assert.equal(callUrl({phone: "not-a-phone"}), "");
  assert.equal(callUrl({phone: "774513523"}), "");
  assert.equal(callUrl({phone: "+33612345678"}), "tel:+33612345678");
});

test("scripts integres de l'annuaire et de la fiche : syntaxe JS valide", () => {
  for (const [name, html] of [["index.html", index], ["fiche.html", fiche]]) {
    const blocks = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length > 0, "au moins un script : " + name);
    for (const block of blocks) {
      if (block[1].trim()) new vm.Script(block[1], {filename: name});
    }
  }
});

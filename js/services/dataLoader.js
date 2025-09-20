/**
 * dataLoader.js — FIX province con etichette (no "069"), cache-busting semplice
 * Carica i JSON reali da /data/ e fornisce utilità per Province→Comuni e Paesi.
 * Compatibile con SelectCascade.js esistente.
 */
(function(){
  const VERSION = "v8"; // bump per cache-busting
  const q = (url) => `${url}?${VERSION}`;

  // Percorsi *relativi* alla root del progetto (coerenti con <base> di Pages)
  const PATHS = {
    COMUNI:  q("data/data_comuni_min.cleaned.json"),
    GEO:     q("data/data_geo_hierarchy_min.cleaned.json"),
    SCUOLE:  q("data/data_scuole_min.json"),
    PAESI:   q("data/data_paesi_esteri.json")
  };

  async function fetchJSON(url){
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
    return res.json();
  }

  // --- Loader “reali” (nessun fallback demo in produzione) ---
  async function loadComuni(){  return fetchJSON(PATHS.COMUNI); }
  async function loadGeo(){     return fetchJSON(PATHS.GEO); }
  async function loadScuole(){  return fetchJSON(PATHS.SCUOLE); }
  async function loadPaesi(){   return fetchJSON(PATHS.PAESI); }

  // --- Normalizzazioni ---
  // Paesi: accetta sia array puro sia { nazioni:[...] }
  function normalizeCountries(raw){
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.nazioni)) return raw.nazioni;
    return [];
  }

  /**
   * buildProvinceMap({ geo, comuni }) -> Map<labelProvincia, Array<labelComune>>
   * Obiettivo: far vedere Nomi provincia (es. "Chieti (CH)"), non ID tipo "069".
   *
   * geo atteso nel formato { province: [ { id: "069", label: "Chieti (CH)", sigla:"CH", reg_id:"13" }, ... ] }
   * comuni atteso come array di { label:"Altino", prov_id:"069", reg_id:"13", ... }
   */
  function buildProvinceMap({ geo, comuni }){
    const collator = new Intl.Collator("it", { sensitivity: "base" });

    // Mappa prov_id -> label leggibile
    const provLabelById = new Map();
    if (geo && Array.isArray(geo.province)){
      for (const p of geo.province){
        const id = String(p.id ?? "").trim();
        const label = String(p.label ?? "").trim();
        if (id && label) provLabelById.set(id, label);
      }
    }

    // Raggruppo i comuni per id provincia
    const comuniByProvId = new Map();
    for (const c of Array.isArray(comuni) ? comuni : []){
      const pid = String(c.prov_id ?? "").trim();
      const cname = String(c.label ?? "").trim();
      if (!pid || !cname) continue;
      if (!comuniByProvId.has(pid)) comuniByProvId.set(pid, []);
      comuniByProvId.get(pid).push(cname);
    }

    // Converto in Map<labelProvincia, [comuni ordinati]>
    const out = new Map();
    for (const [pid, list] of comuniByProvId.entries()){
      const provLabel = provLabelById.get(pid) || pid; // fallback: se manca geo
      const sorted = list.filter(Boolean);
      // de-dup + sort
      const uniq = Array.from(new Set(sorted)).sort(collator.compare);
      out.set(provLabel, uniq);
    }

    // Ordino le chiavi della mappa per label (stabile)
    const ordered = new Map([...out.entries()].sort((a,b)=> collator.compare(a[0], b[0])));
    return ordered;
  }

  /**
   * provincesFromMap(map) -> Array<labelProvincia>
   * Restituisce le province ordinate alfabeticamente come le vuole SelectCascade.
   */
  function provincesFromMap(map){
    return Array.from(map.keys());
  }

  // API pubblica
  window.DataLoader = {
    // raw loaders
    loadComuni,
    loadGeo,
    loadScuole,
    loadPaesi,

    // helpers
    normalizeCountries,
    buildProvinceMap,
    provincesFromMap
  };
})();

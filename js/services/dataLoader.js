/**
 * dataLoader.js (no demo fallback, cache-busting, percorsi Pages)
 * Carica i 4 JSON reali da /data/ e fornisce utilità di normalizzazione.
 */
(function(){
  const VERSION = "v7"; // cambia quando fai un nuovo deploy
  const q = (url) => `${url}?${VERSION}`;

  // Percorsi *relativi* alla root del progetto (no slash iniziale!)
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

  // --- Normalizzazioni flessibili ---
  // Paesi: accetta sia array puro sia { nazioni:[...] }
  function normalizeCountries(raw){
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.nazioni)) return raw.nazioni;
    return [];
  }

  // Province→Comuni (nomi) da:
  // 1) geo: { Regione: { Provincia: [Comuni] } }  (preferito)
  // 2) comuni: array di record (usa campi comuni/provincia/label se presenti)
  function buildProvinceMap({ geo, comuni }){
    const collator = new Intl.Collator("it", { sensitivity: "base" });

    // Caso 1: geo strutturato per nomi
    if (geo && typeof geo === "object"){
      const m = new Map();
      Object.values(geo).forEach(regionObj => {
        if (!regionObj || typeof regionObj !== "object") return;
        Object.entries(regionObj).forEach(([prov, comuniArr]) => {
          if (!Array.isArray(comuniArr)) return;
          const uniq = Array.from(new Set(comuniArr.filter(Boolean)));
          uniq.sort(collator.compare);
          m.set(prov, uniq);
        });
      });
      if (m.size > 0) return m;
    }

    // Caso 2: derivazione dai "comuni"
    const m2 = new Map();
    (comuni || []).forEach(rec => {
      // Nomi tolleranti su campi frequenti
      const provName = rec.provincia || rec.prov || rec.prov_name || rec.prov_id || null;
      const comuneName = rec.comune || rec.label || rec.nome || null;
      if (!provName || !comuneName) return;
      if (!m2.has(provName)) m2.set(provName, []);
      const arr = m2.get(provName);
      if (!arr.includes(comuneName)) arr.push(comuneName);
    });
    // ordina
    m2.forEach(list => list.sort(collator.compare));
    return m2;
  }

  // Utility: lista province ordinate
  function provincesFromMap(map){
    const collator = new Intl.Collator("it", { sensitivity: "base" });
    return Array.from(map.keys()).sort(collator.compare);
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

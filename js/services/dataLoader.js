/**
 * dataLoader.js — FIX province con etichette (no "069"), cache-busting semplice
 * Carica i JSON reali da /data/ e fornisce utilità per Province→Comuni e Paesi.
 * Compatibile con SelectCascade.js esistente.
 */
(function(){
  const VERSION = "v8"; // bump per cache-busting
  const q = (url) => `${url}?${VERSION}`;

  const PATHS = {
    COMUNI:  q("data/data_comuni_min.cleaned.json"),
    GEO:     q("data/data_geo_hierarchy_min.cleaned.json"),
    SCUOLE:  q("data/data_scuole_min.json"),
    PAESI:   q("data/data_paesi_esteri.json"),
    ISCRITTI: q("data/data_iscritti.json")
  };

  async function fetchJSON(url){
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
    return res.json();
  }

  async function loadComuni(){  return fetchJSON(PATHS.COMUNI); }
  async function loadGeo(){     return fetchJSON(PATHS.GEO); }
  async function loadScuole(){  return fetchJSON(PATHS.SCUOLE); }
  async function loadPaesi(){   return fetchJSON(PATHS.PAESI); }
  async function loadIscritti(){ return fetchJSON(PATHS.ISCRITTI); }

  function normalizeCountries(raw){
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.nazioni)) return raw.nazioni;
    return [];
  }

  function buildProvinceMap({ geo, comuni }){
    const collator = new Intl.Collator("it", { sensitivity: "base" });
    const provLabelById = new Map();
    if (geo && Array.isArray(geo.province)){
      for (const p of geo.province){
        const id = String(p.id ?? "").trim();
        const label = String(p.label ?? "").trim();
        if (id && label) provLabelById.set(id, label);
      }
    }
    const comuniByProvId = new Map();
    for (const c of Array.isArray(comuni) ? comuni : []){
      const pid = String(c.prov_id ?? "").trim();
      const cname = String(c.label ?? "").trim();
      const ccode = String(c.belfiore ?? "").trim(); 
      if (!pid || !cname || !ccode) continue;
      if (!comuniByProvId.has(pid)) comuniByProvId.set(pid, []);
      comuniByProvId.get(pid).push({ label: cname, code: ccode });
    }
    const out = new Map();
    for (const [pid, list] of comuniByProvId.entries()){
      const provLabel = provLabelById.get(pid) || pid;
      list.sort((a, b) => collator.compare(a.label, b.label));
      out.set(provLabel, list);
    }
    const ordered = new Map([...out.entries()].sort((a,b)=> collator.compare(a[0], b[0])));
    return ordered;
  }

  function provincesFromMap(map){
    return Array.from(map.keys());
  }

  window.DataLoader = {
    loadComuni,
    loadGeo,
    loadScuole,
    loadPaesi,
    loadIscritti,
    normalizeCountries,
    buildProvinceMap,
    provincesFromMap
  };
})();
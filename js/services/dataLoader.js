/**
 * dataLoader.js
 * Carica i JSON reali se presenti; in caso di 404 usa i demo.
 * Pensato per GitHub Pages: path relativi alla root del sito.
 */
(function(){
  const cacheBust = () => `?v=${Date.now()}`;

  async function fetchJSON(path){
    const res = await fetch(`${path}${cacheBust()}`);
    if(!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
    return res.json();
  }

  async function loadJSON(primary, fallback){
    try{
      return await fetchJSON(primary);
    }catch(err){
      console.warn(`[dataLoader] Fallback -> ${fallback} (${err.message})`);
      return await fetchJSON(fallback);
    }
  }

  // File “reali” attesi (tu li caricherai in /data)
  const REAL = {
    GEO: 'data/geo_hierarchy_min.cleaned.json', // regioni -> province -> comuni[]
    COMUNI: 'data/comuni_min.cleaned.json',     // [{comune, provincia, regione, codice_catastale}]
    SCUOLE: 'data/scuole_min.json',             // [{regione, provincia, citta, ist_princ_nome, plesso_nome}]
    COUNTRIES: 'data/paesi_esteri.json'         // ["Albania","Francia",...]
  };

  // Demo (inclusi in repo per test iniziali)
  const DEMO = {
    GEO: 'data/demo/demo_geo_hierarchy.json',
    COMUNI: 'data/demo/demo_comuni_min.json',
    SCUOLE: 'data/demo/demo_scuole_roma.json',
    COUNTRIES: 'data/demo/demo_paesi_esteri.json'
  };

  const DataLoader = {
    loadGeoHierarchy(){ return loadJSON(REAL.GEO, DEMO.GEO); },
    loadComuniMin(){    return loadJSON(REAL.COMUNI, DEMO.COMUNI); },
    loadScuole(){       return loadJSON(REAL.SCUOLE, DEMO.SCUOLE); },
    loadCountries(){    return loadJSON(REAL.COUNTRIES, DEMO.COUNTRIES); }
  };

  window.DataLoader = DataLoader;
})();

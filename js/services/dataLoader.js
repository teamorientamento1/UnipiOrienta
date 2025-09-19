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

  const REAL = {
    GEO: 'data/geo_hierarchy_min.cleaned.json',
    COMUNI: 'data/comuni_min.cleaned.json',
    SCUOLE: 'data/scuole_min.json',
    COUNTRIES: 'data/paesi_esteri.json'
  };

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

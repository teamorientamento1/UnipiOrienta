// datasets.js — v0.3.1
// Caricamento dataset per wizard con percorsi RELATIVI + fallback intelligente.
//
// Novità v0.3.1:
// - Prova più basi relative: data/, ./data/, ../data/, ../../data/
// - Priorità ai file ".cleaned.json", fallback ai nomi semplici
// - Log in console su quali URL sono stati provati/caricati
// - Avviso se la pagina è aperta in file:// (fetch locale non supportato)
//
// Formati supportati:
//
// 1) Nuovo schema compatto (preferito):
//    geo_hierarchy_min(.cleaned).json
//      { "regioni":[{"id":"09","label":"Toscana"}, ...],
//        "province":[{"id":"050","label":"Pisa (PI)","sigla":"PI","reg_id":"09"}, ...] }
//    comuni_min(.cleaned).json
//      [ {"label":"Pisa","belfiore":"G702","prov_id":"050","reg_id":"09","alt":null}, ... ]
//    → Normalizzati in:
//      regioni[{cod,name}], province[{cod,name,regione_cod,sigla}], comuni[{cod,name,provincia_cod,regione_cod,alt}]
//
// 2) Schema legacy (fallback):
//   - regioni.json    -> [{ "cod":"09", "name":"Toscana" }, ...]
//   - province.json   -> [{ "cod":"PI","name":"Pisa","regione_cod":"09" }, ...]
//   - comuni.json     -> [{ "cod":"050026","name":"Cascina","provincia_cod":"PI" }, ...]
(function(){
  const DEMO = {
    countries: [
      { code: "FR", name: "Francia" }, { code: "DE", name: "Germania" },
      { code: "ES", name: "Spagna"  }, { code: "GB", name: "Regno Unito" },
      { code: "US", name: "Stati Uniti" }, { code: "RO", name: "Romania" },
      { code: "AL", name: "Albania" }, { code: "IN", name: "India" },
      { code: "CN", name: "Cina"    }, { code: "BR", name: "Brasile" }
    ],
    regioni: [ { cod:"09", name:"Toscana" }, { cod:"07", name:"Lazio" } ],
    province: [
      { cod:"PI", name:"Pisa (PI)",    regione_cod:"09", sigla:"PI" },
      { cod:"FI", name:"Firenze (FI)", regione_cod:"09", sigla:"FI" },
      { cod:"RM", name:"Roma (RM)",    regione_cod:"07", sigla:"RM" }
    ],
    comuni: [
      { cod:"G261", name:"Cascina",   provincia_cod:"050" },
      { cod:"G702", name:"Pisa",      provincia_cod:"050" },
      { cod:"D612", name:"Firenze",   provincia_cod:"048" },
      { cod:"I402", name:"Scandicci", provincia_cod:"048" },
      { cod:"H501", name:"Roma",      provincia_cod:"058" }
    ]
  };

  // --- Avviso file:// ---
  if (location.protocol === "file:") {
    console.warn(
      "[MASKERA] Stai aprendo la pagina in file:// — i fetch di JSON locali possono fallire. " +
      "Avvia un piccolo server locale (es. `py -m http.server 8000`) e apri http://localhost:8000/"
    );
  }

  // --- Fuzzy util (già usato nel wizard) ---
  const norm = s => (s || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\s]/g,"").trim();

  function levenshtein(a,b){
    if(a === b) return 0; const m=a.length, n=b.length;
    if(m===0) return n; if(n===0) return m;
    const dp = Array.from({length:m+1}, (_,i)=>Array(n+1).fill(0));
    for(let i=0;i<=m;i++) dp[i][0]=i;
    for(let j=0;j<=n;j++) dp[0][j]=j;
    for(let i=1;i<=m;i++){
      for(let j=1;j<=n;j++){
        const cost = (a[i-1]===b[j-1]) ? 0 : 1;
        dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
      }
    }
    return dp[m][n];
  }

  function fuzzyFilter(list, q, key, limit=10){
    const nq = norm(q);
    if(!nq) return list.slice(0, limit);
    const scored = list.map(item => {
      const t = norm(item[key]);
      let score = 0;
      if(t.startsWith(nq)) score = 3;
      else if(t.includes(nq)) score = 2;
      else { const d = levenshtein(nq, t.slice(0, nq.length)); score = d <= 1 ? 1 : 0; }
      return { item, score };
    }).filter(x => x.score > 0)
      .sort((a,b) => b.score - a.score || a.item[key].localeCompare(b.item[key]));
    return scored.slice(0, limit).map(x => x.item);
  }

  // --- Fetch JSON sicuro ---
  async function safeFetchJson(url){
    try{
      const res = await fetch(url, { cache:"no-store" });
      if(!res.ok) throw new Error("HTTP "+res.status);
      console.info("[MASKERA] Caricato:", url);
      return await res.json();
    }catch(e){
      console.debug("[MASKERA] Fallito:", url, e.message || e);
      return null;
    }
  }

  // Genera URL candidati per un file nella cartella "data" usando basi relative
  function candidateUrls(fileName){
    const bases = ["data/", "./data/", "../data/", "../../data/"];
    // Dedup semplice
    const uniq = Array.from(new Set(bases)).filter(Boolean);
    return uniq.map(b => b + fileName);
  }

  // Prova una lista di nomi file (in ordine) e per ciascuno prova più basi relative
  async function loadFirstJsonFromNames(fileNames){
    for(const name of fileNames){
      const urls = candidateUrls(name);
      for(const u of urls){
        const data = await safeFetchJson(u);
        if(data) return data;
      }
    }
    return null;
  }

  // --- Normalizzazione dal nuovo schema compatto ---
  function normalizeFromMin(geo, comuni){
    if(!geo || !geo.regioni || !geo.province || !Array.isArray(comuni)) return null;

    const regioni = geo.regioni.map(r => ({
      cod:  String(r.id ?? "").trim(),
      name: String(r.label ?? "").trim()
    }));

    const province = geo.province.map(p => ({
      cod:  String(p.id ?? "").trim(),
      name: String(p.label ?? "").trim(),
      regione_cod: String(p.reg_id ?? "").trim(),
      sigla: String(p.sigla ?? "").trim()
    }));

    const comuniNorm = comuni.map(c => ({
      cod:  String(c.belfiore ?? "").trim(),      // usiamo Belfiore come "cod" comune
      name: String(c.label ?? "").trim(),
      provincia_cod: String(c.prov_id ?? "").trim(),
      regione_cod:   String(c.reg_id ?? "").trim(),
      alt: c.alt ?? null
    }));

    // Ordinamenti per UI
    const byName = (a,b) => a.name.localeCompare(b.name, "it", {sensitivity:"base"});
    regioni.sort(byName);
    province.sort((a,b) => a.regione_cod.localeCompare(b.regione_cod) || byName(a,b));
    comuniNorm.sort((a,b) =>
      a.regione_cod.localeCompare(b.regione_cod)
      || a.provincia_cod.localeCompare(b.provincia_cod)
      || byName(a,b)
    );

    return { regioni, province, comuni: comuniNorm };
  }

  async function loadAll(){
    // 0) Countries (opzionale). Se presente in /data, lo carichiamo.
    const countries = await loadFirstJsonFromNames(["countries.json"]);

    // 1) Nuovo schema compatto (preferito): prima ".cleaned", poi "base"
    const geo = await loadFirstJsonFromNames([
      "geo_hierarchy_min.cleaned.json",
      "geo_hierarchy_min.json"
    ]);

    const comuniMin = await loadFirstJsonFromNames([
      "comuni_min.cleaned.json",
      "comuni_min.json"
    ]);

    if(geo && comuniMin){
      const normed = normalizeFromMin(geo, comuniMin);
      if(normed){
        console.info("[MASKERA] Dataset: nuovo schema compatto (min) attivo.");
        return {
          countries: countries || DEMO.countries,
          regioni:   normed.regioni,
          province:  normed.province,
          comuni:    normed.comuni,
          utils: {
            fuzzyFilter,
            provincesByRegione: (regCod) => normed.province.filter(p => p.regione_cod === regCod),
            comuniByProvincia:  (provCod) => normed.comuni.filter(c => c.provincia_cod === provCod),
            allProvinces: () => normed.province.slice(),
            allComuniByProvinces: (provCod) => normed.comuni.filter(c => c.provincia_cod === provCod)
          }
        };
      }
    }

    // 2) Fallback schema legacy
    console.warn("[MASKERA] Fallback ai dataset legacy (regioni/province/comuni separati).");
    const [regioni, province, comuni] = await Promise.all([
      loadFirstJsonFromNames(["regioni.json"]),
      loadFirstJsonFromNames(["province.json"]),
      loadFirstJsonFromNames(["comuni.json"])
    ]);

    return {
      countries: countries || DEMO.countries,
      regioni:   regioni   || DEMO.regioni,
      province:  province  || DEMO.province,
      comuni:    comuni    || DEMO.comuni,
      utils: {
        fuzzyFilter,
        provincesByRegione: (regCod) => (province || DEMO.province).filter(p => p.regione_cod === regCod),
        comuniByProvincia:  (provCod) => (comuni || DEMO.comuni).filter(c => c.provincia_cod === provCod),
        allProvinces: () => (province || DEMO.province).slice(),
        allComuniByProvinces: (provCod) => (comuni || DEMO.comuni).filter(c => c.provincia_cod === provCod)
      }
    };
  }

  // Espone un oggetto con Promise ready
  const DATA_HOLDER = { ready: null };
  DATA_HOLDER.ready = loadAll().then(d => {
    Object.assign(DATA_HOLDER, d);
    return DATA_HOLDER; // così chi fa .then riceve i dati
  });

  window.MASKERA_DATA = DATA_HOLDER;
})();

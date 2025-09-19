// datasets.js — v0.4.1 (geo + scuole)
// - Carica regioni/province/comuni (schema "min" o legacy) con fallback demo
// - Carica scuole_min(.cleaned).json e crea gerarchia Regione→Provincia→Città→Istituto→Plesso
// - Funziona anche offline con py -m http.server

(function(){
  // ---- util base ----
  function norm(s){ return (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }
  function levenshtein(a,b){
    a=a||""; b=b||"";
    const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
    for(let i=0;i<=m;i++) dp[i][0]=i; for(let j=0;j<=n;j++) dp[0][j]=j;
    for(let i=1;i<=m;i++){
      for(let j=1;j<=n;j++){
        const c=(a[i-1]===b[j-1]?0:1);
        dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+c);
      }
    }
    return dp[m][n];
  }
  function fuzzyFilter(list, q, key, limit=10){
    const nq = norm(q); if(!nq) return list.slice(0,limit);
    const scored = list.map(item=>{
      const t = norm(item[key]); let score=0;
      if(t.startsWith(nq)) score=100-nq.length; else if(t.includes(nq)) score=200-nq.length; else score=300+levenshtein(t,nq);
      return { item, score };
    });
    return scored.sort((a,b)=>a.score-b.score).slice(0,limit).map(x=>x.item);
  }
  function uniqBy(arr, keyFn){ const m=new Map(); for(const x of (arr||[])){ m.set(keyFn(x),x); } return Array.from(m.values()); }
  function normKey(s){ return norm(String(s||"").replace(/\s+/g," ")); }

  // ---- check ambiente ----
  if(typeof window==="undefined" || typeof document==="undefined"){
    console.warn("[MASKERA] datasets.js richiede un ambiente browser.");
    return;
  }
  if(location.protocol==="file:"){
    console.warn("[MASKERA] Stai aprendo la pagina in file:// — avvia un server locale (es. `py -m http.server 8000`).");
  }

  // ---- fetch robusto ----
  async function safeFetchJson(url){
    try{
      const r = await fetch(url, { cache:"no-store" });
      if(!r.ok) throw new Error("HTTP "+r.status);
      console.info("[MASKERA] Caricato:", url);
      return await r.json();
    }catch(e){ console.warn("[MASKERA] Fallito:", url, e?.message||e); return null; }
  }

  // Percorsi da provare (consente override da config + include assets/data/)
  const EXTRA_BASES = Array.isArray((window.MASKERA_CONFIG||{}).DATA_BASES) ? (window.MASKERA_CONFIG||{}).DATA_BASES : [];
  const CFG = window.MASKERA_CONFIG || {};
  const BASES = [...EXTRA_BASES, "assets/data/","data/","./data/","../data/","../../data/"];

  async function loadFirstJsonFromNames(names){
    for(const base of BASES){
      for(const nm of names){
        const js = await safeFetchJson(base+nm);
        if(js) return js;
      }
    }
    return null;
  }

  // ---- normalizza schema "min" (geo) ----
  function normalizeFromMin(geoMin, comuniMin){
    const regioni = (geoMin?.regioni||[]).map(r=>({ cod:r.id, name:r.label }));
    const province = (geoMin?.province||[]).map(p=>({ cod:p.id, name:p.label, regione_cod:p.regione_id, sigla:p.sigla }));
    const comuni   = (comuniMin||[]).map(c=>({ cod:c.codice, name:c.nome, provincia_cod:c.provincia_id }));
    return { regioni, province, comuni };
  }

  // ---- normalizza schema legacy (regioni/province/comuni separati) ----
  function normalizeFromLegacy(regioniJson, provinceJson, comuniJson){
    const regioni = (regioniJson||[]).map(r=>({ cod:r.codice, name:r.nome }));
    const province= (provinceJson||[]).map(p=>({ cod:p.codice, name:`${p.nome} (${p.sigla})`, regione_cod:p.regione_cod, sigla:p.sigla }));
    const comuni  = (comuniJson||[]).map(c=>({ cod:c.codice, name:c.nome, provincia_cod:c.provincia_cod }));
    return { regioni, province, comuni };
  }

  // ---- normalizza scuole_min.json ----
  function normalizeScuole(rows){
    const raw = Array.isArray(rows)? rows : [];
    const regioni = uniqBy(raw.map(r=>({ cod:normKey(r.regione),  name:r.regione })), x=>x.cod);
    const province= uniqBy(raw.map(r=>({ cod:normKey(r.provincia),name:r.provincia,  regione_cod:normKey(r.regione) })), x=>x.cod);
    const citta   = uniqBy(raw.map(r=>({ cod:normKey(r.citta),    name:r.citta,      provincia_cod:normKey(r.provincia) })), x=>x.cod);
    const istituti= uniqBy(raw.map(r=>({ cod:normKey(r.ist_princ_nome), name:r.ist_princ_nome, citta_cod:normKey(r.citta) })), x=>x.cod);
    const plessi  = raw.map(r=>({ cod:normKey(r.plesso_nome), name:r.plesso_nome, istituto_cod:normKey(r.ist_princ_nome) }));

    // indici rapidi
    const provByReg = province.reduce((m,p)=>(m[p.regione_cod]=(m[p.regione_cod]||[]).concat(p),m),{});
    const cityByProv= citta.reduce((m,c)=>(m[c.provincia_cod]=(m[c.provincia_cod]||[]).concat(c),m),{});
    const istByCity = istituti.reduce((m,i)=>(m[i.citta_cod]=(m[i.citta_cod]||[]).concat(i),m),{});
    const plByIst   = plessi.reduce((m,p)=>(m[p.istituto_cod]=(m[p.istituto_cod]||[]).concat(p),m),{});

    return {
      regioni,
      provincesByRegione : (regCod)=> provByReg[regCod] || [],
      cittaByProvincia   : (provCod)=> cityByProv[provCod] || [],
      istitutiByCitta    : (citCod)=> istByCity[citCod] || [],
      plessiByIstituto   : (istCod)=> plByIst[istCod] || []
    };
  }

  // ---- DEMO fallback (include Roma/Pisa/Firenze + 1 scuola) ----
  const DEMO = {
    countries:[{code:"FR",name:"Francia"},{code:"DE",name:"Germania"}],
    regioni:[{cod:"09",name:"Toscana"},{cod:"07",name:"Lazio"}],
    province:[
      {cod:"050",name:"Pisa (PI)",regione_cod:"09",sigla:"PI"},
      {cod:"048",name:"Firenze (FI)",regione_cod:"09",sigla:"FI"},
      {cod:"058",name:"Roma (RM)",regione_cod:"07",sigla:"RM"}
    ],
    comuni:[
      {cod:"G702",name:"Pisa",provincia_cod:"050"},
      {cod:"D612",name:"Firenze",provincia_cod:"048"},
      {cod:"H501",name:"Roma",provincia_cod:"058"}
    ],
    schools:function(){
      const rows=[{
        regione:"Lazio",
        provincia:"Roma (RM)",
        citta:"Roma",
        ist_princ_nome:"Liceo Scientifico Statale Galileo Galilei",
        plesso_nome:"Sede Centrale"
      }];
      return normalizeScuole(rows);
    }
  };

  // ---- caricamento completo ----
  async function loadAll(){
    // 1) countries (facoltativo)
    const countries = await loadFirstJsonFromNames(["countries.cleaned.json","countries.json"]);

    // 2) geo (regioni/province/comuni)
    let regioni=null, province=null, comuni=null;
    const geoMin = await loadFirstJsonFromNames(["geo_hierarchy_min.cleaned.json","geo_hierarchy_min.json"]);
    const comuniMin = await loadFirstJsonFromNames(["comuni_min.cleaned.json","comuni_min.json"]);
    if(geoMin && comuniMin){
      const n = normalizeFromMin(geoMin, comuniMin);
      regioni=n.regioni; province=n.province; comuni=n.comuni;
    }else{
      const [r,p,c] = await Promise.all([
        loadFirstJsonFromNames(["regioni.json"]),
        loadFirstJsonFromNames(["province.json"]),
        loadFirstJsonFromNames(["comuni.json"])
      ]);
      regioni=r||DEMO.regioni; province=p||DEMO.province; comuni=c||DEMO.comuni;
    }

    // 3) scuole
    let scuoleMin = null;
    if(CFG && CFG.SCHOOLS_URL){
      try{ scuoleMin = await safeFetchJson(CFG.SCHOOLS_URL); }
      catch(e){ console.warn("[MASKERA] SCHOOLS_URL fallita:", e?.message||e); }
    }
    if(!scuoleMin){
      scuoleMin = await loadFirstJsonFromNames(["scuole_min.cleaned.json","scuole_min.json"]);
    }
    const schools = scuoleMin ? normalizeScuole(scuoleMin) : DEMO.schools;

    return {
      countries: countries || DEMO.countries,
      regioni, province, comuni,
      utils: {
        fuzzyFilter,
        provincesByRegione: (reg)=> (province||[]).filter(p=>p.regione_cod===reg),
        comuniByProvincia:  (prov)=> (comuni||[]).filter(c=>c.provincia_cod===prov),
        allProvinces: ()=> (province||[]).slice(),
        allComuniByProvinces: (prov)=> (comuni||[]).filter(c=>c.provincia_cod===prov),
        schools
      }
    };
  }

  const DATA_HOLDER = { ready: null };
  DATA_HOLDER.ready = loadAll().then(d=>{ Object.assign(DATA_HOLDER, d); return DATA_HOLDER; });
  window.MASKERA_DATA = DATA_HOLDER;
})();

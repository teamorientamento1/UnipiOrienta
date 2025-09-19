// datasets.js — v0.4.0 (geo + scuole)
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
    for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ const c=(a[i-1]===b[j-1])?0:1; dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+c);} }
    return dp[m][n];
  }
  function fuzzyFilter(list, q, key, limit=10){
    const nq = norm(q); if(!nq) return list.slice(0,limit);
    const scored = list.map(item=>{
      const t = norm(item[key]); let score=0;
      if(t.startsWith(nq)) score=3; else if(t.includes(nq)) score=2;
      else { const d=levenshtein(nq,t.slice(0,nq.length)); score = d<=1?1:0; }
      return {item,score};
    }).filter(x=>x.score>0).sort((a,b)=> b.score-a.score || a.item[key].localeCompare(b.item[key]));
    return scored.slice(0,limit).map(x=>x.item);
  }
  function uniqBy(list, keyFn){ const s=new Set(); return (list||[]).filter(it=>{ const k=keyFn(it); if(s.has(k)) return false; s.add(k); return true; }); }
  function normKey(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[\"“”']/g,"").replace(/\s+/g," ").trim(); }

  if (location.protocol === "file:") {
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
  const BASES = ["data/","./data/","../data/","../../data/"];
  async function loadFirstJsonFromNames(names){
    for(const base of BASES){ for(const nm of names){ const js = await safeFetchJson(base+nm); if(js) return js; } }
    return null;
  }

  // ---- normalizza schema "min" (geo) ----
  function normalizeFromMin(geoMin, comuniMin){
    const regioni = (geoMin?.regioni||[]).map(r=>({ cod:r.id, name:r.label }));
    const province = (geoMin?.province||[]).map(p=>({ cod:p.id, name:p.label, regione_cod:p.reg_id, sigla:p.sigla }));
    const comuni   = (comuniMin||[]).map(c=>({ cod:c.belfiore||c.id||c.cod, name:c.label, provincia_cod:c.prov_id, regione_cod:c.reg_id, alt:c.alt??null }));

    // Aggiunto sorting alfabetico
    regioni.sort((a,b) => a.name.localeCompare(b.name, 'it', {sensitivity: 'base'}));
    province.sort((a,b) => a.name.localeCompare(b.name, 'it', {sensitivity: 'base'}));
    comuni.sort((a,b) => a.name.localeCompare(b.name, 'it', {sensitivity: 'base'}));

    return { regioni, province, comuni };
  }

  // ---- normalizza scuole_min.json ----
  function normalizeScuole(rows){
    const raw = Array.isArray(rows)? rows : [];
    const regioni = uniqBy(raw.map(r=>({ cod:normKey(r.regione), name:String(r.regione||"").trim() })), x=>x.cod)
                    .sort((a,b)=>a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
    const provByReg={}, cityByProv={}, istByCity={}, plByIst={};
    raw.forEach(r=>{
      const kReg=normKey(r.regione), kProv=normKey(r.provincia), kCit=normKey(r.citta), kIst=normKey(r.ist_princ_nome), kPl=normKey(r.plesso_nome);
      (provByReg[kReg] ||= []).push({ cod:kProv, name:String(r.provincia||"").trim() });
      (cityByProv[kProv] ||= []).push({ cod:kCit,  name:String(r.citta||"").trim() });
      (istByCity[kCit]  ||= []).push({ cod:kIst,  name:String(r.ist_princ_nome||"").trim() });
      (plByIst[kIst]    ||= []).push({ cod:kPl,   name:String(r.plesso_nome||"").trim() });
    });
    for(const k in provByReg) provByReg[k] = uniqBy(provByReg[k], x=>x.cod).sort((a,b)=>a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
    for(const k in cityByProv) cityByProv[k] = uniqBy(cityByProv[k], x=>x.cod).sort((a,b)=>a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
    for(const k in istByCity)  istByCity[k]  = uniqBy(istByCity[k], x=>x.cod).sort((a,b)=>a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
    for(const k in plByIst)    plByIst[k]    = uniqBy(plByIst[k], x=>x.cod).sort((a,b)=>a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
    return {
      regioni,
      provinceByRegione : (regCod)=> provByReg[regCod] || [],
      cittaByProvincia  : (provCod)=> cityByProv[provCod] || [],
      istitutiByCitta   : (citCod)=> istByCity[citCod] || [],
      plessiByIstituto  : (istCod)=> plByIst[istCod] || []
    };
  }

  // ---- DEMO fallback (include Roma/Pisa/Firenze + 1 scuola) ----
  const DEMO = {
    countries:[{code:"FR",name:"Francia"},{code:"DE",name:"Germania"}],
    regioni:[{cod:"09",name:"Toscana"},{cod:"07",name:"Lazio"}],
    province:[{cod:"050",name:"Pisa (PI)",regione_cod:"09",sigla:"PI"},{cod:"048",name:"Firenze (FI)",regione_cod:"09",sigla:"FI"},{cod:"058",name:"Roma (RM)",regione_cod:"07",sigla:"RM"}],
    comuni:[{cod:"G702",name:"Pisa",provincia_cod:"050"},{cod:"D612",name:"Firenze",provincia_cod:"048"},{cod:"H501",name:"Roma",provincia_cod:"058"}],
    schools:function(){
      const rows=[{regione:"Lazio",provincia:"Roma (RM)",citta:"Roma",ist_princ_nome:"Liceo Scientifico Statale Galileo Galilei",plesso_nome:"Sede Centrale"}];
      return normalizeScuole(rows);
    }()
  };

  async function loadAll(){
    const countries = await loadFirstJsonFromNames(["countries.cleaned.json","countries.json"]);

    // geo schema "min"
    const geo = await loadFirstJsonFromNames(["geo_hierarchy_min.cleaned.json","geo_hierarchy_min.json"]);
    const comuniMin = await loadFirstJsonFromNames(["comuni_min.cleaned.json","comuni_min.json"]);
    let regioni,province,comuni;
    if(geo && comuniMin){ ({regioni,province,comuni}=normalizeFromMin(geo,comuniMin)); }
    else {
      // legacy
      const [r,p,c] = await Promise.all([loadFirstJsonFromNames(["regioni.json"]),loadFirstJsonFromNames(["province.json"]),loadFirstJsonFromNames(["comuni.json"])]);
      regioni=r||DEMO.regioni; province=p||DEMO.province; comuni=c||DEMO.comuni;
    }

    // scuole
    const scuoleMin = await loadFirstJsonFromNames(["scuole_min.cleaned.json","scuole_min.json"]);
    const schools = scuoleMin ? normalizeScuole(scuoleMin) : DEMO.schools;

    // Aggiunto logging per check dati caricati
    if (regioni.length === 0 || province.length === 0 || comuni.length === 0) {
      console.error("[MASKERA] Dati geografici incompleti o non caricati. Usando DEMO limitato.");
    }

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
// wizard.js — v0.4.5
// - Flusso anagrafica senza telefono/email
// - Aggiunta interfaccia SCUOLE (Regione→Provincia→Città→Istituto→Plesso)
// - Compatibile sia con index.html (CF multiparte) sia con wizard.html (CF singolo)

(function(){
  const CFG = window.MASKERA_CONFIG || { UI:{ hiddenClass:"hidden", errorClass:"error" }, COPY:{ required:"Questo campo è obbligatorio.", invalidFormat:"Formato non valido." } };
  const VAL  = window.MASKERA_VALIDATION || {};
  const DATA = window.MASKERA_DATA || { ready: Promise.resolve({}) };
  const H = CFG.UI.hiddenClass;
  const $  = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  // --- map wrapper ids for index.html fallback ---
  const fieldToWrapId = {
    'nome':'wrapNome','cognome':'wrapCognome','genere':'wrapGenere','data_nascita':'wrapDob',
    'nato_estero':'wrapEstero','nascita_estero':'wrapPaeseNascita','nascita_it':'wrapRegioneNascita',
    'provincia_nascita':'wrapProvNasc','comune_nascita':'wrapComuneNasc','residenza':'wrapProvRes',
    'comune_res':'wrapComuneRes','dsa':'wrapDsa',
    // scuole (nuovo)
    'scuola_regione':'wrapScuolaReg','scuola_provincia':'wrapScuolaProv',
    'scuola_citta':'wrapScuolaCom','scuola_istituto':'wrapScuolaIst','scuola_plesso':'wrapScuolaPlesso'
  };
  const wrap = (field)=> document.querySelector(`.field-step[data-field="${field}"]`) || (fieldToWrapId[field] ? document.getElementById(fieldToWrapId[field]) : null);
  const show = (field)=>{ const w=wrap(field); if(w) w.classList.remove(H); };
  const hide = (field)=>{ const w=wrap(field); if(w) w.classList.add(H); };

  const PARTICELLE = new Set(["di","de","del","della","dello","dei","degli","d'","da","dal","dai","dalle","dallo","la","le","lo","van","von","von der","mc"]);
  function capWord(w,force=false){ if(!w) return w; if(w.includes("-")) return w.split("-").map((seg,i)=>capWord(seg,force||i===0)).join("-"); const low=w.toLowerCase(); if(PARTICELLE.has(low)&&!force) return low; return low.charAt(0).toUpperCase()+low.slice(1); }
  function titleCaseIT(s){ return (s||"").trim().replace(/\s+/g," ").split(" ").map((tok,i)=>capWord(tok,i===0)).join(" "); }
  function isSelected(sel){ return !!(sel && sel.value && sel.value!==""); }
  function radioValue(radios){ const r=(radios||[]).find(x=>x.checked); return r ? r.value : null; }

  // block Enter (niente submit accidentali)
  document.addEventListener("keydown", (e)=>{
    const t = e.target;
    if(e.key!=="Enter") return;
    if(!/^(input|select|textarea)$/i.test(t?.tagName)) return;
    const isTextarea = t.tagName?.toLowerCase()==="textarea";
    if(!(isTextarea && e.shiftKey)) e.preventDefault();
  }, true);

  // elementi
  const el = {
    nome: $("#nome"), cognome: $("#cognome"),
    genere: $$('input[name="genere"]'), sessoNascita: $("#sesso_nascita"),
    dataNascita: $("#data_nascita"),
    estero: $$('input[name="nato_estero"]'),
    paeseNascita: $("#paese_nascita"), regioneNascita: $("#regione_nascita"),
    provinciaNascita: $("#provincia_nascita"), comuneNascita: $("#comune_nascita"),
    provinciaRes: $("#provincia_res"), comuneRes: $("#comune_res"),
    dsa: $$('input[name="dsa"]'),
    // CF singolo (wizard.html)
    cfSingle: $("#codice_fiscale"),
    // SCUOLE
    scuolaReg: $("#scuola_regione"), scuolaProv: $("#scuola_provincia"),
    scuolaCitta: $("#scuola_citta"), scuolaIst: $("#scuola_istituto"), scuolaPlesso: $("#scuola_plesso"),
    procedi: $("#btnProcedi") || $("#prosegui") || $('button[type="submit"]')
  };

  // Nome/Cognome
  function validName(v){ return VAL.validateName ? !!VAL.validateName(v).ok : (String(v||"").trim().length>=2); }
  function onNomeChanged(){ if(!el.nome) return; const tc=titleCaseIT(el.nome.value||""); if(el.nome.value!==tc) el.nome.value=tc; if(validName(el.nome.value)) show("cognome"); checkProceed(); }
  function onCognomeChanged(){ if(!el.cognome) return; const tc=titleCaseIT(el.cognome.value||""); if(el.cognome.value!==tc) el.cognome.value=tc; if(validName(el.cognome.value)) show("genere"); checkProceed(); }
  el.nome && el.nome.addEventListener("input", onNomeChanged);
  el.nome && el.nome.addEventListener("blur", onNomeChanged);
  el.cognome && el.cognome.addEventListener("input", onCognomeChanged);
  el.cognome && el.cognome.addEventListener("blur", onCognomeChanged);

  // CF singolo
  function runCFValidationSingle(){
    if(!el.cfSingle || !VAL.validateCodiceFiscale) return true;
    const v=(el.cfSingle.value||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,16);
    if(el.cfSingle.value!==v) el.cfSingle.value=v;
    if(!v){ VAL.setError && VAL.setError(el.cfSingle,""); return true; }
    const comuni=(window.MASKERA_DATA&&window.MASKERA_DATA.comuni)||[];
    const res=VAL.validateCodiceFiscale(v,comuni);
    VAL.setError && VAL.setError(el.cfSingle, res.ok?"":(res.msg||CFG.COPY.invalidFormat));
    return !!res.ok;
  }
  if(el.cfSingle){
    el.cfSingle.addEventListener("input", runCFValidationSingle);
    el.cfSingle.addEventListener("blur", runCFValidationSingle);
    DATA.ready?.then(()=>{ if(el.cfSingle.value) runCFValidationSingle(); });
    show("codice_fiscale");
  }

  // Genere → Data
  function onGenereChanged(){
    const v = radioValue(el.genere);
    const sessoWrap = document.getElementById('wrapSessoNascita');
    if(sessoWrap) sessoWrap.classList.toggle('hidden', v!=='X');
    if(v) show('data_nascita');
    checkProceed();
  }
  (el.genere||[]).forEach(r=>r.addEventListener("change", onGenereChanged));

  // Data → Estero?
  function onDataNascitaChanged(){
    if(!el.dataNascita || !el.dataNascita.value) return;
    if(VAL.validateDate){
      const res = VAL.validateDate(el.dataNascita.value);
      VAL.setError && VAL.setError(el.dataNascita, res.ok ? "" : res.msg);
      VAL.setWarning && VAL.setWarning(el.dataNascita, res.warn || "");
    }
    show('nato_estero');
    checkProceed();
  }
  if(el.dataNascita){
    el.dataNascita.addEventListener('change', onDataNascitaChanged);
    el.dataNascita.addEventListener('blur', onDataNascitaChanged);
  }

  // Nato estero switch
  function bindEstero(){
    if(!el.estero || el.estero.length===0) return;
    const handler=()=>{
      const v=radioValue(el.estero);
      const wrapBirth=document.getElementById('wrapBirthRight'); wrapBirth && wrapBirth.classList.remove('hidden');
      if(v==="si"){ show("nascita_estero"); hide("nascita_it"); hide("wrapProvNasc"); hide("wrapComuneNasc"); }
      else if(v==="no"){ show("nascita_it"); hide("nascita_estero"); }
      checkProceed();
    };
    el.estero.forEach(r=>r.addEventListener("change", handler));
  }
  bindEstero();

  // helper select
  function fillSelect(sel, items, labelKey="name", valueKey="cod", placeholder="Seleziona…"){
    if(!sel) return;
    const prev = sel.value;
    sel.innerHTML=""; const o = document.createElement("option"); o.value=""; o.textContent=placeholder; sel.appendChild(o);
    (items||[]).forEach(it=>{ const opt=document.createElement("option"); opt.value=String(it[valueKey]??""); opt.textContent=String(it[labelKey]??""); sel.appendChild(opt); });
    if(prev && Array.from(sel.options).some(x=>x.value===prev)) sel.value=prev;
  }

  // dataset pronto
  let DATASET = { regioni:[], province:[], comuni:[], utils:{} };
  let SCHOOLS  = null;
  DATA.ready?.then(d=>{
    DATASET = d || DATASET;
    SCHOOLS = d?.utils?.schools || null;
    if(el.regioneNascita) fillSelect(el.regioneNascita, DATASET.regioni, "name","cod","Regione di nascita");
    if(el.provinciaRes)   fillSelect(el.provinciaRes, DATASET.province,"name","cod","Provincia di residenza");
    if(SCHOOLS && el.scuolaReg) fillSelect(el.scuolaReg, SCHOOLS.regioni, "name","cod","Regione della scuola");
  });

  // nascita IT → province → comuni
  el.regioneNascita && el.regioneNascita.addEventListener("change", ()=>{
    const reg = el.regioneNascita.value;
    const listP = (DATASET.utils?.provincesByRegione?.(reg)) || DATASET.province.filter(p=>p.regione_cod===reg);
    fillSelect(el.provinciaNascita, listP, "name","cod","Provincia di nascita");
    if(reg){ show("provincia_nascita"); show("wrapProvNasc"); }
    fillSelect(el.comuneNascita, [], "name","cod","Comune di nascita");
    hide("comune_nascita"); hide("wrapComuneNasc"); checkProceed();
  });
  el.provinciaNascita && el.provinciaNascita.addEventListener("change", ()=>{
    const prov = el.provinciaNascita.value;
    const listC = (DATASET.utils?.comuniByProvincia?.(prov)) || DATASET.comuni.filter(c=>c.provincia_cod===prov);
    fillSelect(el.comuneNascita, listC, "name","cod","Comune di nascita");
    if(prov){ show("comune_nascita"); show("wrapComuneNasc"); }
    checkProceed();
  });
  el.comuneNascita && el.comuneNascita.addEventListener("change", ()=>{
    if(el.comuneNascita.value){ show("wrapProvRes"); show("residenza"); }
    checkProceed();
  });

  // nascita estero → residenza
  el.paeseNascita && ["input","blur"].forEach(evt=> el.paeseNascita.addEventListener(evt, ()=>{
    if(el.paeseNascita.value && el.paeseNascita.value.length>=2){ show("wrapProvRes"); show("residenza"); }
    checkProceed();
  }));

  // residenza → comuni
  el.provinciaRes && el.provinciaRes.addEventListener("change", ()=>{
    const prov = el.provinciaRes.value;
    const listC = (DATASET.utils?.comuniByProvincia?.(prov)) || DATASET.comuni.filter(c=>c.provincia_cod===prov);
    fillSelect(el.comuneRes, listC, "name","cod","Comune di residenza");
    if(prov){ show("comune_res"); show("wrapComuneRes"); }
    checkProceed();
  });
  el.comuneRes && el.comuneRes.addEventListener("change", ()=>{
    if(el.comuneRes.value){ show('dsa'); show('wrapDsa'); if(SCHOOLS && el.scuolaReg){ show('scuola_regione'); show('wrapScuolaReg'); } }
    checkProceed();
  });

  // DSA → completato
  (el.dsa||[]).forEach(r=>r.addEventListener("change", ()=>{
    if(radioValue(el.dsa)){
      window.MASKERA_WIZARD_COMPLETE = true;
      window.MASKERA_CHECK_PROCEED && window.MASKERA_CHECK_PROCEED();
    }
    checkProceed();
  }));

  // ==== SCUOLE: cascading ====
  function resetScuole(from){
    if(from<=1){ fillSelect(el.scuolaProv, [],"name","cod","Provincia della scuola"); hide("scuola_provincia"); hide("wrapScuolaProv"); }
    if(from<=2){ fillSelect(el.scuolaCitta,[],"name","cod","Città della scuola"); hide("scuola_citta"); hide("wrapScuolaCom"); }
    if(from<=3){ fillSelect(el.scuolaIst,  [],"name","cod","Istituto principale"); hide("scuola_istituto"); hide("wrapScuolaIst"); }
    if(from<=4){ fillSelect(el.scuolaPlesso,[],"name","cod","Plesso"); hide("scuola_plesso"); hide("wrapScuolaPlesso"); }
  }
  el.scuolaReg && el.scuolaReg.addEventListener("change", ()=>{
    const reg = el.scuolaReg.value; resetScuole(1);
    if(reg && SCHOOLS){ fillSelect(el.scuolaProv, SCHOOLS.provinceByRegione(reg),"name","cod","Provincia della scuola"); show("scuola_provincia"); show("wrapScuolaProv"); }
  });
  el.scuolaProv && el.scuolaProv.addEventListener("change", ()=>{
    const prov = el.scuolaProv.value; resetScuole(2);
    if(prov && SCHOOLS){ fillSelect(el.scuolaCitta, SCHOOLS.cittaByProvincia(prov),"name","cod","Città della scuola"); show("scuola_citta"); show("wrapScuolaCom"); }
  });
  el.scuolaCitta && el.scuolaCitta.addEventListener("change", ()=>{
    const cit = el.scuolaCitta.value; resetScuole(3);
    if(cit && SCHOOLS){ fillSelect(el.scuolaIst, SCHOOLS.istitutiByCitta(cit),"name","cod","Istituto principale"); show("scuola_istituto"); show("wrapScuolaIst"); }
  });
  el.scuolaIst && el.scuolaIst.addEventListener("change", ()=>{
    const ist = el.scuolaIst.value; resetScuole(4);
    if(ist && SCHOOLS){ fillSelect(el.scuolaPlesso, SCHOOLS.plessiByIstituto(ist),"name","cod","Plesso"); show("scuola_plesso"); show("wrapScuolaPlesso"); }
  });

  // gating del bottone Procedi (nessun vincolo su scuole: opzionale)
  function checkProceed(){
    if(!el.procedi) return;
    const okNome = el.nome ? validName(el.nome.value) : true;
    const okCogn = el.cognome ? validName(el.cognome.value) : true;
    const okCFone = el.cfSingle ? runCFValidationSingle() : true;
    const vEst = radioValue(el.estero); const okEst = el.estero && el.estero.length>0 ? !!vEst : true;
    let okNasc = true;
    if(vEst){ okNasc = vEst==="si" ? true : (isSelected(el.regioneNascita)&&isSelected(el.provinciaNascita)&&isSelected(el.comuneNascita)); }
    const okRes = (el.provinciaRes ? isSelected(el.provinciaRes) : true) && (el.comuneRes ? isSelected(el.comuneRes) : true);
    el.procedi.disabled = !(okNome && okCogn && okCFone && okEst && okNasc && okRes);
  }
  ["input","change","blur"].forEach(evt=>{
    el.nome && el.nome.addEventListener(evt, checkProceed);
    el.cognome && el.cognome.addEventListener(evt, checkProceed);
    el.cfSingle && el.cfSingle.addEventListener(evt, checkProceed);
    el.regioneNascita && el.regioneNascita.addEventListener(evt, checkProceed);
    el.provinciaNascita && el.provinciaNascita.addEventListener(evt, checkProceed);
    el.comuneNascita && el.comuneNascita.addEventListener(evt, checkProceed);
    el.provinciaRes && el.provinciaRes.addEventListener(evt, checkProceed);
    el.comuneRes && el.comuneRes.addEventListener(evt, checkProceed);
    (el.genere||[]).forEach(r=>r.addEventListener(evt, checkProceed));
    (el.estero||[]).forEach(r=>r.addEventListener(evt, checkProceed));
    el.sessoNascita && el.sessoNascita.addEventListener(evt, checkProceed);
    el.dataNascita && el.dataNascita.addEventListener(evt, checkProceed);
  });
  DATA.ready?.then(()=>checkProceed());
  checkProceed();
})();

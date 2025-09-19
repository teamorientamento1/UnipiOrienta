// wizard.js — v0.4.7
// Tutte le domande OBBLIGATORIE (nessuna opzionale)
// - DSA già rimosso
// - Nessun "sesso di nascita" per genere X
// - Wizard completo SOLO quando sono compilati TUTTI i campi richiesti
// - Scuole (Regione→Provincia→Città→Istituto→Plesso) obbligatorie

(function(){
  const CFG = window.MASKERA_CONFIG || { UI:{ hiddenClass:"hidden", errorClass:"error" }, COPY:{ required:"Questo campo è obbligatorio.", invalidFormat:"Formato non valido." } };
  const VAL  = window.MASKERA_VALIDATION || {};
  const DATA = window.MASKERA_DATA || { ready: Promise.resolve({}) };
  const H = CFG.UI.hiddenClass;
  const $  = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  const fieldToWrapId = {
    'nome':'wrapNome','cognome':'wrapCognome','genere':'wrapGenere','data_nascita':'wrapDob',
    'nato_estero':'wrapEstero','nascita_estero':'wrapPaeseNascita','nascita_it':'wrapRegioneNascita',
    'provincia_nascita':'wrapProvNasc','comune_nascita':'wrapComuneNasc','residenza':'wrapProvRes',
    'comune_res':'wrapComuneRes',
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

  // blocco invio accidentale
  document.addEventListener("keydown", (e)=>{
    const t = e.target;
    if(e.key!=="Enter") return;
    if(!/^(input|select|textarea)$/i.test(t?.tagName)) return;
    const isTextarea = t.tagName?.toLowerCase()==="textarea";
    if(!(isTextarea && e.shiftKey)) e.preventDefault();
  }, true);

  const el = {
    nome: $("#nome"), cognome: $("#cognome"),
    genere: $$('input[name="genere"]'),
    dataNascita: $("#data_nascita"),
    estero: $$('input[name="nato_estero"]'),
    paeseNascita: $("#paese_nascita"), regioneNascita: $("#regione_nascita"),
    provinciaNascita: $("#provincia_nascita"), comuneNascita: $("#comune_nascita"),
    provinciaRes: $("#provincia_res"), comuneRes: $("#comune_res"),
    // CF singolo (solo wizard.html)
    cfSingle: $("#codice_fiscale"),
    // Scuole
    scuolaReg: $("#scuola_regione"), scuolaProv: $("#scuola_provincia"),
    scuolaCitta: $("#scuola_citta"), scuolaIst: $("#scuola_istituto"), scuolaPlesso: $("#scuola_plesso"),
    procedi: $("#btnProcedi") || $("#prosegui") || $('button[type="submit"]')
  };

  // ===== Nome / Cognome obbligatori =====
  function validName(v){ return VAL.validateName ? !!VAL.validateName(v).ok : (String(v||"").trim().length>=2); }
  function onNomeChanged(){ if(!el.nome) return; const tc=titleCaseIT(el.nome.value||""); if(el.nome.value!==tc) el.nome.value=tc; if(validName(el.nome.value)) show("cognome"); checkProceed(); }
  function onCognomeChanged(){ if(!el.cognome) return; const tc=titleCaseIT(el.cognome.value||""); if(el.cognome.value!==tc) el.cognome.value=tc; if(validName(el.cognome.value)) show("genere"); checkProceed(); }

  // ===== Genere / Data / Estero =====
  function onGenereChanged(){ if(radioValue(el.genere)) show("data_nascita"); checkProceed(); }
  function onDataNascitaChanged(){ if(el.dataNascita?.value) show("nato_estero"); checkProceed(); }
  function onEsteroChanged(){ 
    const v = radioValue(el.estero);
    if(v === "si"){ hide("nascita_it"); hide("provincia_nascita"); hide("comune_nascita"); show("nascita_estero"); }
    else if(v === "no"){ hide("nascita_estero"); show("nascita_it"); }
    checkProceed();
  }

  // ===== Luogo di nascita (estero o IT) =====
  function onPaeseNascitaChanged(){ checkProceed(); }
  function onRegioneNascitaChanged(){
    const reg = el.regioneNascita.value; 
    console.log("Regione selezionata:", reg); // Logging aggiunto
    if (!DATASET || !DATASET.province) {
      console.error("Dati geografici non pronti! Province:", DATASET?.province);
      alert("Dati geografici non caricati. Ricarica la pagina.");
      return;
    }
    const provs = DATASET.utils.provincesByRegione(reg);
    console.log("Province trovate:", provs.length, provs.map(p => p.name)); // Logging province
    fillSelect(el.provinciaNascita, provs, "name", "cod", "Provincia di nascita");
    if(reg) show("provincia_nascita");
    hide("comune_nascita");
    checkProceed();
  }
  function onProvinciaNascitaChanged(){
    const prov = el.provinciaNascita.value;
    fillSelect(el.comuneNascita, DATASET.utils.comuniByProvincia(prov), "name", "cod", "Città di nascita");
    if(prov) show("comune_nascita");
    checkProceed();
  }
  function onComuneNascitaChanged(){ show("residenza"); checkProceed(); }

  // ===== Residenza =====
  function onProvinciaResChanged(){
    const prov = el.provinciaRes.value;
    console.log("Provincia residenza selezionata:", prov); // Logging aggiunto
    if (!DATASET || !DATASET.comuni) {
      console.error("Dati geografici non pronti! Comuni:", DATASET?.comuni);
      alert("Dati geografici non caricati. Ricarica la pagina.");
      return;
    }
    const coms = DATASET.utils.comuniByProvincia(prov);
    console.log("Comuni trovati:", coms.length, coms.map(c => c.name)); // Logging comuni
    fillSelect(el.comuneRes, coms, "name", "cod", "Città di residenza");
    if(prov) show("comune_res");
    checkProceed();
  }
  function onComuneResChanged(){ show("scuola_regione"); checkProceed(); }

  // ===== Scuole (cascade) =====
  // ... (il resto del codice per scuole rimane uguale, truncato per brevità, ma includi tutto dall'originale)

  // ===== Attacca eventi (con wait for DATA.ready) =====
  DATA.ready.then(() => {
    el.nome && el.nome.addEventListener("input", onNomeChanged);
    el.cognome && el.cognome.addEventListener("input", onCognomeChanged);
    el.genere.forEach(r => r.addEventListener("change", onGenereChanged));
    el.dataNascita && el.dataNascita.addEventListener("change", onDataNascitaChanged);
    el.estero.forEach(r => r.addEventListener("change", onEsteroChanged));
    el.paeseNascita && el.paeseNascita.addEventListener("change", onPaeseNascitaChanged);
    el.regioneNascita && el.regioneNascita.addEventListener("change", onRegioneNascitaChanged);
    el.provinciaNascita && el.provinciaNascita.addEventListener("change", onProvinciaNascitaChanged);
    el.comuneNascita && el.comuneNascita.addEventListener("change", onComuneNascitaChanged);
    el.provinciaRes && el.provinciaRes.addEventListener("change", onProvinciaResChanged);
    el.comuneRes && el.comuneRes.addEventListener("change", onComuneResChanged);
    // ... (aggiungi per scuole se necessario)

    // Prime valutazioni
    checkProceed();
  });

  // ===== Gating: tutte le condizioni obbligatorie =====
  // ... (il resto rimane uguale, includi computeAllOk, setWizardCompleteFlag, etc.)
})();
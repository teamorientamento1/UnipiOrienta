// wizard.js — v0.4.7 FIXED
// Tutte le domande OBBLIGATORIE (nessuna opzionale)

(function(){
  const CFG = window.MASKERA_CONFIG || { UI:{ hiddenClass:"hidden", errorClass:"error" }, COPY:{ required:"Questo campo è obbligatorio.", invalidFormat:"Formato non valido." } };
  const VAL  = window.MASKERA_VALIDATION || {};
  const DATA = window.MASKERA_DATA || { ready: Promise.resolve({}) };
  const H = CFG.UI.hiddenClass;
  const $  = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  // VARIABILE GLOBALE MANCANTE
  let DATASET;

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

  // FUNZIONE MANCANTE: fillSelect
  function fillSelect(selectEl, items, nameKey, valueKey, placeholder) {
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="">${placeholder || "Seleziona..."}</option>`;
    (items || []).forEach(item => {
      const option = document.createElement('option');
      option.value = item[valueKey] || '';
      option.textContent = item[nameKey] || '';
      selectEl.appendChild(option);
    });
  }

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
  function onNomeChanged(){ 
    if(!el.nome) return; 
    const tc=titleCaseIT(el.nome.value||""); 
    if(el.nome.value!==tc) el.nome.value=tc; 
    if(validName(el.nome.value)) show("cognome"); 
    checkProceed(); 
  }
  function onCognomeChanged(){ 
    if(!el.cognome) return; 
    const tc=titleCaseIT(el.cognome.value||""); 
    if(el.cognome.value!==tc) el.cognome.value=tc; 
    if(validName(el.cognome.value)) show("genere"); 
    checkProceed(); 
  }

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
    console.log("Regione selezionata:", reg);
    if (!DATASET || !DATASET.province) {
      console.error("Dati geografici non pronti! Province:", DATASET?.province);
      alert("Dati geografici non caricati. Ricarica la pagina.");
      return;
    }
    const provs = DATASET.utils.provincesByRegione(reg);
    console.log("Province trovate:", provs.length, provs.map(p => p.name));
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
    console.log("Provincia residenza selezionata:", prov);
    if (!DATASET || !DATASET.comuni) {
      console.error("Dati geografici non pronti! Comuni:", DATASET?.comuni);
      alert("Dati geografici non caricati. Ricarica la pagina.");
      return;
    }
    const coms = DATASET.utils.comuniByProvincia(prov);
    console.log("Comuni trovati:", coms.length, coms.map(c => c.name));
    fillSelect(el.comuneRes, coms, "name", "cod", "Città di residenza");
    if(prov) show("comune_res");
    checkProceed();
  }
  function onComuneResChanged(){ show("scuola_regione"); checkProceed(); }

  // ===== Scuole (cascade) =====
  function onScuolaRegioneChanged(){
    const reg = el.scuolaReg.value;
    if (!DATASET || !DATASET.utils.schools) {
      console.error("Dati scuole non pronti!");
      return;
    }
    const provs = DATASET.utils.schools.provinceByRegione(reg);
    fillSelect(el.scuolaProv, provs, "name", "cod", "Provincia della scuola");
    if(reg) show("scuola_provincia");
    hide("scuola_citta"); hide("scuola_istituto"); hide("scuola_plesso");
    checkProceed();
  }
  function onScuolaProvinciaChanged(){
    const prov = el.scuolaProv.value;
    const cities = DATASET.utils.schools.cittaByProvincia(prov);
    fillSelect(el.scuolaCitta, cities, "name", "cod", "Città della scuola");
    if(prov) show("scuola_citta");
    hide("scuola_istituto"); hide("scuola_plesso");
    checkProceed();
  }
  function onScuolaCittaChanged(){
    const city = el.scuolaCitta.value;
    const istituti = DATASET.utils.schools.istitutiByCitta(city);
    fillSelect(el.scuolaIst, istituti, "name", "cod", "Istituto principale");
    if(city) show("scuola_istituto");
    hide("scuola_plesso");
    checkProceed();
  }
  function onScuolaIstitutoChanged(){
    const ist = el.scuolaIst.value;
    const plessi = DATASET.utils.schools.plessiByIstituto(ist);
    fillSelect(el.scuolaPlesso, plessi, "name", "cod", "Plesso");
    if(ist) show("scuola_plesso");
    checkProceed();
  }
  function onScuolaPlessoChanged(){
    checkProceed();
  }

  // FUNZIONE MANCANTE: checkProceed
  function checkProceed() {
    const allOk = computeAllOk();
    setWizardCompleteFlag(allOk);
    if (window.MASKERA_CHECK_PROCEED) {
      window.MASKERA_CHECK_PROCEED();
    }
  }

  function computeAllOk() {
    // Verifica tutti i campi obbligatori
    const nome = el.nome?.value?.trim();
    const cognome = el.cognome?.value?.trim();
    const genere = radioValue(el.genere);
    const dataNascita = el.dataNascita?.value?.trim();
    const estero = radioValue(el.estero);
    
    if (!nome || !cognome || !genere || !dataNascita || !estero) return false;
    
    if (estero === "si") {
      const paese = el.paeseNascita?.value?.trim();
      if (!paese) return false;
    } else {
      const regNasc = el.regioneNascita?.value;
      const provNasc = el.provinciaNascita?.value;
      const comNasc = el.comuneNascita?.value;
      if (!regNasc || !provNasc || !comNasc) return false;
    }
    
    const provRes = el.provinciaRes?.value;
    const comRes = el.comuneRes?.value;
    if (!provRes || !comRes) return false;
    
    const scuolaReg = el.scuolaReg?.value;
    const scuolaProv = el.scuolaProv?.value;
    const scuolaCitta = el.scuolaCitta?.value;
    const scuolaIst = el.scuolaIst?.value;
    const scuolaPlesso = el.scuolaPlesso?.value;
    if (!scuolaReg || !scuolaProv || !scuolaCitta || !scuolaIst || !scuolaPlesso) return false;
    
    return true;
  }

  function setWizardCompleteFlag(complete) {
    window.MASKERA_WIZARD_COMPLETE = complete;
  }

  // ===== Attacca eventi (con wait for DATA.ready) =====
  DATA.ready.then((data) => {
    console.log("Dataset caricati:", data);
    DATASET = data; // ASSEGNAZIONE MANCANTE
    
    // Popola le select iniziali
    if (data.regioni) {
      fillSelect(el.regioneNascita, data.regioni, "name", "cod", "Seleziona la regione...");
    }
    if (data.province) {
      fillSelect(el.provinciaRes, data.province, "name", "cod", "Seleziona la provincia...");
    }
    if (data.utils?.schools?.regioni) {
      fillSelect(el.scuolaReg, data.utils.schools.regioni, "name", "cod", "Seleziona la regione...");
    }
    
    // Attacca eventi
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
    el.scuolaReg && el.scuolaReg.addEventListener("change", onScuolaRegioneChanged);
    el.scuolaProv && el.scuolaProv.addEventListener("change", onScuolaProvinciaChanged);
    el.scuolaCitta && el.scuolaCitta.addEventListener("change", onScuolaCittaChanged);
    el.scuolaIst && el.scuolaIst.addEventListener("change", onScuolaIstitutoChanged);
    el.scuolaPlesso && el.scuolaPlesso.addEventListener("change", onScuolaPlessoChanged);

    // Prime valutazioni
    checkProceed();
  }).catch(error => {
    console.error("Errore nel caricamento dei dataset:", error);
    // Fallback con dati demo se il caricamento fallisce
    DATASET = {
      regioni: [{cod:"09", name:"Toscana"}],
      province: [{cod:"050", name:"Pisa", regione_cod:"09"}],
      comuni: [{cod:"G702", name:"Pisa", provincia_cod:"050"}],
      utils: {
        provincesByRegione: () => [{cod:"050", name:"Pisa"}],
        comuniByProvincia: () => [{cod:"G702", name:"Pisa"}],
        schools: {
          regioni: [{cod:"09", name:"Toscana"}],
          provinceByRegione: () => [{cod:"050", name:"Pisa"}],
          cittaByProvincia: () => [{cod:"G702", name:"Pisa"}],
          istitutiByCitta: () => [{cod:"PISA001", name:"Liceo Galilei"}],
          plessiByIstituto: () => [{cod:"SEDE01", name:"Sede Centrale"}]
        }
      }
    };
    checkProceed();
  });

  // Esporta checkProceed globalmente
  window.MASKERA_CHECK_PROCEED = checkProceed;
})();
// wizard.js – v0.4.3
// Compatibile con:
//  - wizard.html  → CF singolo (#codice_fiscale) + wrapper <section class="field-step" data-field="...">
//  - index.html   → CF multiparte (#cf_form con #part1..#part5 e #cf-error)
//
// Novità 0.4.3:
//  - CF multiparte: NESSUN autofocus al campo successivo (il cursore resta dove stai scrivendo)
//  - Paste distribuito: riempie i campi successivi ma il focus resta sul campo dove incolli
//  - Backspace a inizio campo torna al precedente (come prima)
//  - Nome/Cognome: capitalizzazione "Title Case" con particelle italiane
//  - Telefono: normalizzazione su blur e validazione (9–15 cifre, '+' opzionale)
//  - Enter bloccato negli input (tranne Shift+Enter nelle textarea)

(function(){
  const CFG = window.MASKERA_CONFIG || {
    UI: { hiddenClass: "hidden", errorClass: "error" },
    COPY: {
      required: "Questo campo è obbligatorio.",
      telInvalid: "Numero non valido. 9–15 cifre (ammessi + e trattini, senza spazi).",
      invalidFormat: "Il formato non è valido."
    }
  };
  const VAL  = window.MASKERA_VALIDATION || {};
  const DATA = window.MASKERA_DATA || { ready: Promise.resolve({}) };

  const H  = CFG.UI.hiddenClass;
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  
  // FIX: Funzione wrap modificata per supportare entrambe le strutture HTML
  const wrap = (field) => {
    // Prima prova con la struttura di wizard.html
    let w = document.querySelector(`.field-step[data-field="${field}"]`);
    
    // Se non trova, prova con la struttura di index.html
    if (!w) {
      // Mappa i nomi dei campi agli ID dei wrapper in index.html
      const fieldToWrapId = {
        'nome': 'wrapNome',
        'cognome': 'wrapCognome',
        'genere': 'wrapGenere',
        'data_nascita': 'wrapDob',
        'nato_estero': 'wrapEstero',
        'nascita_estero': 'wrapPaeseNascita',
        'nascita_it': 'wrapRegioneNascita',
        'provincia_nascita': 'wrapProvNasc',
        'comune_nascita': 'wrapComuneNasc',
        'residenza': 'wrapProvRes',
        'comune_res': 'wrapComuneRes',
        'telefono': 'wrapTel1',
        'email1': 'wrapEmail1',
        'email2': 'wrapEmail2',
        'dsa': 'wrapDsa'
      };
      const wrapId = fieldToWrapId[field];
      if (wrapId) w = document.getElementById(wrapId);
    }
    
    return w;
  };

  function show(field){ const w=wrap(field); if(w) w.classList.remove(H); }
  function hide(field){ const w=wrap(field); if(w) w.classList.add(H); }
  function isSelected(sel){ return !!(sel && sel.value && sel.value!==""); }
  function radioValue(radios){ const r=(radios||[]).find(x=>x.checked); return r ? r.value : null; }

  // Blocca Enter negli input (Shift+Enter solo in textarea)
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if(e.key !== "Enter") return;
    if(!/^(input|select|textarea)$/i.test(t?.tagName)) return;
    const isTextarea = t.tagName?.toLowerCase()==="textarea";
    const allow = isTextarea && e.shiftKey;
    if(!allow) e.preventDefault();
  }, true);

  // ----- Capitalizzazione Nome/Cognome -----
  const PARTICELLE = new Set([
    "di","de","del","della","dello","dei","degli","d'","d'","da","dal","dai","dalle","dallo",
    "la","le","lo","van","von","von der","mc"
  ]);
  function capWord(w, force=false){
    if(!w) return w;
    const ap = w.includes("'") ? "'" : (w.includes("'") ? "'" : null);
    if(ap){
      const [pre, post] = w.split(ap);
      const preL = pre.toLowerCase();
      const preOut  = (force || !PARTICELLE.has(preL)) ? preL.charAt(0).toUpperCase()+preL.slice(1) : preL;
      const postOut = post ? post.charAt(0).toUpperCase()+post.slice(1).toLowerCase() : "";
      return preOut + ap + postOut;
    }
    if(w.includes("-")) return w.split("-").map((seg,i)=>capWord(seg, force||i===0)).join("-");
    const low = w.toLowerCase();
    return (force || !PARTICELLE.has(low)) ? low.charAt(0).toUpperCase()+low.slice(1) : low;
  }
  function titleCaseIT(s){
    if(!s) return s;
    return s.trim().replace(/\s+/g," ")
      .split(" ").map((tok,i)=>capWord(tok, i===0)).join(" ");
  }

  // ----- Riferimenti generali (tutti opzionali: codice safe se mancano) -----
  const el = {
    // Identità
    nome: $("#nome"),
    cognome: $("#cognome"),
    // Nascita & residenza
    genere: $$('input[name="genere"]'),
    sessoNascita: $("#sessoNascita"),
    dataNascita: $("#data_nascita"),
    estero: $$('input[name="nato_estero"]'),
    paeseNascita: $("#paese_nascita"),
    regioneNascita: $("#regione_nascita"),
    provinciaNascita: $("#provincia_nascita"),
    comuneNascita: $("#comune_nascita"),
    provinciaRes: $("#provincia_res"),
    comuneRes: $("#comune_res"),
    // Contatti
    telefono: $("#telefono"),
    telefono1: $("#telefono1"),
    telefono2: $("#telefono2"),
    email1: $("#email1"),
    email2: $("#email2"),
    // Codice fiscale (singolo campo)
    cfSingle: $("#codice_fiscale"),
    // Pulsante procedi
    procedi: $("#btnProcedi") || $("#prosegui") || $('button[type="submit"]')
  };

  // ----- Nome -> Cognome -----
  function validName(v){
    if(VAL.validateName) return !!VAL.validateName(v).ok;
    const s = (v||"").trim(); return s.length>=2;
  }
  function onNomeChanged(){
    if(!el.nome) return;
    const raw = el.nome.value || "";
    const tc = titleCaseIT(raw);
    if(raw !== tc) el.nome.value = tc;
    if(validName(el.nome.value)) show("cognome");
    checkProceed();
  }
  function onCognomeChanged(){
    if(!el.cognome) return;
    const raw = el.cognome.value || "";
    const tc = titleCaseIT(raw);
    if(raw !== tc) el.cognome.value = tc;
    if(validName(el.cognome.value)) show("genere");
    checkProceed();
  }
  if(el.nome){ el.nome.addEventListener("input", onNomeChanged); el.nome.addEventListener("blur", onNomeChanged); }
  if(el.cognome){ el.cognome.addEventListener("input", onCognomeChanged); el.cognome.addEventListener("blur", onCognomeChanged); }

  // =====================================================================
  // CF – Modalità A) CF singolo (wizard.html)
  // =====================================================================
  function runCFValidationSingle(){
    if(!el.cfSingle || !VAL.validateCodiceFiscale) return true;
    const v = (el.cfSingle.value||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,16);
    if(el.cfSingle.value !== v) el.cfSingle.value = v;
    if(!v){ VAL.setError && VAL.setError(el.cfSingle, ""); return true; }
    const comuni = (window.MASKERA_DATA && window.MASKERA_DATA.comuni) || [];
    const res = VAL.validateCodiceFiscale(v, comuni);
    VAL.setError && VAL.setError(el.cfSingle, res.ok ? "" : (res.msg || CFG.COPY.invalidFormat));
    return !!res.ok;
  }
  if(el.cfSingle){
    el.cfSingle.addEventListener("input", runCFValidationSingle);
    el.cfSingle.addEventListener("blur", runCFValidationSingle);
    DATA.ready?.then(()=>{ if(el.cfSingle.value) runCFValidationSingle(); });
    show("codice_fiscale"); // se la pagina usa wrapper a step
  }

  // =====================================================================
  // CF – Modalità B) CF multiparte (index.html) – #cf_form con #part1..#part5
  // =====================================================================
  (function initCFMultiparte(){
    const form = document.getElementById("cf_form");
    if(!form) return; // non siamo su index.html

    const ids  = ["part1","part2","part3","part4","part5"];
    const lens = [3,4,2,4,3]; // totale 16
    const parts = ids.map(id => document.getElementById(id));
    const errNode = document.getElementById("cf-error");
    if(!parts[0]) return;

    const clean = s => (s||"").toUpperCase().replace(/[^A-Z0-9]/g,"");

    function refreshVisibility(){
      for(let i=0;i<parts.length;i++){
        const shouldShow = (i===0) ? true : ids.slice(0,i)
          .every((_,k)=> clean(parts[k].value||"").length === lens[k]);
        if(parts[i]){
          parts[i].classList.toggle("hidden", !shouldShow);
        }
      }
    }

    function composeCF(){
      return clean(parts.map(p => p ? p.value : "").join("")).slice(0,16);
    }

    function validateIfComplete(){
      if(!window.MASKERA_VALIDATION || !MASKERA_VALIDATION.validateCodiceFiscale) return;
      const cf = composeCF();
      if(cf.length < 16){
        if(errNode) errNode.textContent = "";
        return;
      }
      const comuni = (window.MASKERA_DATA && window.MASKERA_DATA.comuni) || [];
      const res = MASKERA_VALIDATION.validateCodiceFiscale(cf, comuni);
      if(errNode) errNode.textContent = res.ok ? "" : (res.msg || (window.MASKERA_CONFIG?.COPY?.invalidFormat) || "Formato non valido.");
    }

    parts.forEach((p, i) => {
      if(!p) return;

      // Blocca spazio/enter; Backspace a inizio -> torna al precedente
      p.addEventListener("keydown", (e) => {
        if(e.key === " " || e.key === "Enter"){ e.preventDefault(); }
        if(e.key === "Backspace" && (p.selectionStart===0 && p.selectionEnd===0) && i>0){
          e.preventDefault();
          const prev = parts[i-1];
          if(prev){
            prev.focus();
            const val = prev.value||"";
            prev.setSelectionRange(val.length, val.length);
          }
        }
      });

      // Paste distribuito: riempie anche le successive ma NON sposta il focus
      p.addEventListener("paste", (e) => {
        e.preventDefault();
        let t = (e.clipboardData || window.clipboardData).getData("text") || "";
        t = clean(t);
        if(!t) return;
        let ptr = 0;
        for(let k=i; k<parts.length; k++){
          const target = parts[k]; if(!target) break;
          const need = lens[k];
          const chunk = t.slice(ptr, ptr+need);
          if(chunk.length===0) break;
          target.value = chunk;
          ptr += chunk.length;
        }
        refreshVisibility();
        validateIfComplete();
        // mantieni focus sul campo corrente
        p.focus();
        const val = p.value || "";
        p.setSelectionRange(val.length, val.length);
      });

      // Input: mostra il successivo se pieno, ma NON spostare il focus
      p.addEventListener("input", () => {
        p.value = clean(p.value).slice(0, lens[i]);
        if(p.value.length === lens[i] && i < parts.length-1){
          const next = parts[i+1];
          if(next) next.classList.remove("hidden"); // nessun focus()
        }
        refreshVisibility();
        validateIfComplete();
      });

      // Blur -> valida se completo
      p.addEventListener("blur", validateIfComplete);
    });

    refreshVisibility(); // stato iniziale
  })();

  // =====================================================================
  // Nascita: estero vs Italia + cascata (wizard.html)
  // =====================================================================
  
  // Handler per genere -> mostra data_nascita (o sesso_nascita se X)
  function onGenereChanged(){
    const v = radioValue(el.genere);
    if(!v) return;
    
    // Se genere è X, mostra campo sesso_nascita
    const sessoWrap = document.getElementById('wrapSessoNascita');
    if(sessoWrap){
      if(v === 'X'){
        sessoWrap.classList.remove('hidden');
      } else {
        sessoWrap.classList.add('hidden');
      }
    }
    
    // Mostra data di nascita
    show('data_nascita');
    checkProceed();
  }
  
  // Handler per data di nascita -> mostra nato_estero
  function onDataNascitaChanged(){
    if(!el.dataNascita || !el.dataNascita.value) return;
    
    // Valida la data
    if(VAL.validateDate){
      const res = VAL.validateDate(el.dataNascita.value);
      VAL.setError && VAL.setError(el.dataNascita, res.ok ? "" : res.msg);
      VAL.setWarning && VAL.setWarning(el.dataNascita, res.warn || "");
      
      if(res.ok){
        show('nato_estero');
      }
    } else {
      // Fallback semplice
      if(el.dataNascita.value){
        show('nato_estero');
      }
    }
    checkProceed();
  }
  
  // Bind degli event listener per genere
  if(el.genere && el.genere.length > 0){
    el.genere.forEach(r => r.addEventListener('change', onGenereChanged));
  }
  
  // Bind per data nascita
  if(el.dataNascita){
    el.dataNascita.addEventListener('change', onDataNascitaChanged);
    el.dataNascita.addEventListener('blur', onDataNascitaChanged);
  }
  
  function bindEstero(){
    if(!el.estero || el.estero.length===0) return;
    const handler = ()=>{
      const v = radioValue(el.estero);
      if(v === "si" || v==="true" || v==="1"){
        // Nato all'estero = SÌ
        // Mostra il wrapper generale e il campo paese
        const wrapBirth = document.getElementById('wrapBirthRight');
        if(wrapBirth) wrapBirth.classList.remove('hidden');
        
        const wrapPaese = document.getElementById('wrapPaeseNascita');
        if(wrapPaese) wrapPaese.classList.remove('hidden');
        
        const wrapRegione = document.getElementById('wrapRegioneNascita');
        if(wrapRegione) wrapRegione.classList.add('hidden');
        
        // Nascondi province e comuni italiani
        hide("wrapProvNasc");
        hide("wrapComuneNasc");
        
        // Per wizard.html
        show("nascita_estero");
        hide("nascita_it");
        
      }else if(v === "no" || v==="false" || v==="0"){
        // Nato all'estero = NO (nato in Italia)
        // Mostra il wrapper generale e il campo regione
        const wrapBirth = document.getElementById('wrapBirthRight');
        if(wrapBirth) wrapBirth.classList.remove('hidden');
        
        const wrapRegione = document.getElementById('wrapRegioneNascita');
        if(wrapRegione) wrapRegione.classList.remove('hidden');
        
        const wrapPaese = document.getElementById('wrapPaeseNascita');
        if(wrapPaese) wrapPaese.classList.add('hidden');
        
        // Per wizard.html
        show("nascita_it");
        hide("nascita_estero");
      }
      checkProceed();
    };
    el.estero.forEach(r => r.addEventListener("change", handler));
  }

  function fillSelect(sel, items, labelKey="name", valueKey="cod", placeholder="Seleziona…"){
    if(!sel) return;
    const prev = sel.value;
    sel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = ""; opt0.textContent = placeholder;
    sel.appendChild(opt0);
    (items||[]).forEach(it=>{
      const o = document.createElement("option");
      o.value = String(it[valueKey] ?? "");
      o.textContent = String(it[labelKey] ?? "");
      sel.appendChild(o);
    });
    if(prev && Array.from(sel.options).some(o=>o.value===prev)) sel.value = prev;
  }

  let DATASET = { regioni:[], province:[], comuni:[], utils:{} };
  DATA.ready?.then(d => {
    DATASET = d || DATASET;
    if(el.regioneNascita){
      fillSelect(el.regioneNascita, DATASET.regioni, "name", "cod", "Regione di nascita");
      // NON mostrare nascita_it all'inizio - verrà mostrato quando serve
    }
    if(el.provinciaRes){
      fillSelect(el.provinciaRes, DATASET.province, "name", "cod", "Provincia di residenza");
    }
  });

  if(el.regioneNascita){
    el.regioneNascita.addEventListener("change", ()=>{
      const reg = el.regioneNascita.value;
      const listP = (DATASET.utils?.provincesByRegione?.(reg)) || DATASET.province.filter(p=>p.regione_cod===reg);
      fillSelect(el.provinciaNascita, listP, "name", "cod", "Provincia di nascita");
      if(reg){
        show("provincia_nascita");
        show("wrapProvNasc");
      }
      fillSelect(el.comuneNascita, [], "name", "cod", "Comune di nascita");
      hide("comune_nascita");
      hide("wrapComuneNasc");
      checkProceed();
    });
  }
  if(el.provinciaNascita){
    el.provinciaNascita.addEventListener("change", ()=>{
      const prov = el.provinciaNascita.value;
      const listC = (DATASET.utils?.comuniByProvincia?.(prov)) || DATASET.comuni.filter(c=>c.provincia_cod===prov);
      fillSelect(el.comuneNascita, listC, "name", "cod", "Comune di nascita");
      if(prov){
        show("comune_nascita");
        show("wrapComuneNasc");
      }
      checkProceed();
    });
  }
  if(el.comuneNascita){
    el.comuneNascita.addEventListener("change", ()=>{
      if(el.comuneNascita.value){
        // Dopo aver selezionato il comune di nascita, mostra provincia residenza
        show("wrapProvRes");
        show("residenza");
      }
      checkProceed();
    });
  }
  if(el.paeseNascita){
    // Aggiungi listener sia per input che blur
    el.paeseNascita.addEventListener("input", ()=>{
      if(el.paeseNascita.value && el.paeseNascita.value.length >= 2){
        // Dopo aver inserito paese estero, mostra provincia residenza
        show("wrapProvRes");
        show("residenza");
      }
      checkProceed();
    });
    el.paeseNascita.addEventListener("blur", ()=>{
      if(el.paeseNascita.value && el.paeseNascita.value.length >= 2){
        // Conferma che mostra provincia residenza
        show("wrapProvRes");
        show("residenza");
      }
      checkProceed();
    });
  }
  if(el.provinciaRes){
    el.provinciaRes.addEventListener("change", ()=>{
      const prov = el.provinciaRes.value;
      const listC = (DATASET.utils?.comuniByProvincia?.(prov)) || DATASET.comuni.filter(c=>c.provincia_cod===prov);
      fillSelect(el.comuneRes, listC, "name", "cod", "Comune di residenza");
      if(prov){
        show("comune_res");
        show("wrapComuneRes");
      }
      checkProceed();
    });
  }
  if(el.comuneRes){
    el.comuneRes.addEventListener("change", ()=>{
      if(el.comuneRes.value){
        // Dopo comune residenza, mostra telefono1
        show("wrapTel1");
        show("telefono");
      }
      checkProceed();
    });
  }

  bindEstero();

  // =====================================================================
  // Telefono singolo (#telefono): normalizza + valida
  // =====================================================================
  function setTelHint(){
    const w = wrap("telefono");
    const hint = $("#tel-hint") || (w && w.querySelector(".hint"));
    if(hint){ hint.textContent = "Niente spazi. Solo cifre; '+' opzionale all'inizio. 9–15 cifre."; }
  }
  setTelHint();

  function attachPhone(input, required=true){
    if(!input) return;
    // blocco spazi in tempo reale
    input.addEventListener("keydown", (e)=>{ if(e.key===" ") e.preventDefault(); });
    input.addEventListener("paste", (e)=>{
      e.preventDefault();
      const text = (e.clipboardData||window.clipboardData).getData("text")||"";
      input.value = (input.value + text).replace(/\s+/g,'');
      input.dispatchEvent(new Event('input'));
    });
    input.addEventListener("input", ()=>{ if(/\s/.test(input.value)) input.value = input.value.replace(/\s+/g,''); });
    // normalizza + valida su blur
    input.addEventListener("blur", ()=>{
      const n = VAL.normalizePhone ? VAL.normalizePhone(input.value) : input.value.replace(/[\s().]/g,"");
      if(input.value !== n) input.value = n;
      const res = VAL.validatePhone ? VAL.validatePhone(input.value, !!required)
                                    : { ok: /^\+?\d[\d-]{8,14}$/.test(input.value) };
      const errId = input.getAttribute("aria-describedby")?.split(" ").find(x=>x.includes("tel") && x.includes("error"));
      const errNode = errId ? document.getElementById(errId) : null;
      if(errNode) errNode.textContent = res.ok ? "" : (res.msg || CFG.COPY.telInvalid);
      checkProceed();
    });
  }
  
  // Attach per telefono singolo (wizard.html)
  attachPhone(el.telefono, true);
  
  // Attach per telefono1 (index.html)
  if(el.telefono1){
    attachPhone(el.telefono1, true);
    el.telefono1.addEventListener('blur', ()=>{
      const res = VAL.validatePhone ? VAL.validatePhone(el.telefono1.value, true)
                                    : { ok: /^\+?\d[\d-]{8,14}$/.test(el.telefono1.value) };
      if(res.ok){
        show('wrapTel2'); // Mostra telefono2 (opzionale)
        show('wrapEmail1'); // Mostra anche email1 visto che tel2 è opzionale
      }
    });
  }
  
  // Attach per telefono2 (index.html) - opzionale
  if(el.telefono2){
    attachPhone(el.telefono2, false);
    // Telefono2 è opzionale, quindi email1 è già visibile
  }
  
  // Handler per email1 -> email2
  if(el.email1){
    el.email1.addEventListener('blur', ()=>{
      if(VAL.validateEmail){
        const res = VAL.validateEmail(el.email1.value, true);
        VAL.setError && VAL.setError(el.email1, res.ok ? "" : res.msg);
        if(res.ok && el.email1.value){
          show('wrapEmail2');
        }
      } else if(el.email1.value){
        show('wrapEmail2');
      }
      checkProceed();
    });
  }
  
  // Handler per email2 -> DSA
  if(el.email2){
    el.email2.addEventListener('blur', ()=>{
      // Email2 è opzionale, quindi mostra DSA se c'è qualcosa o se si lascia vuoto
      show('wrapDsa');
      checkProceed();
    });
  }
  
  // Handler per DSA
  const dsaRadios = $('input[name="dsa"]');
  if(dsaRadios && dsaRadios.length > 0){
    dsaRadios.forEach(r => r.addEventListener('change', ()=>{
      const v = radioValue(dsaRadios);
      // Se seleziona "sì", potrebbe esserci un campo dettagli
      const detailsWrap = document.getElementById('dsa_details_wrap');
      if(detailsWrap){
        detailsWrap.classList.toggle('hidden', v !== 'si');
      }
      checkProceed();
      
      // Attiva il bottone globale "Procedi" se tutto è completo
      if(window.MASKERA_WIZARD_COMPLETE === undefined){
        window.MASKERA_WIZARD_COMPLETE = true;
      }
      if(window.MASKERA_CHECK_PROCEED){
        window.MASKERA_CHECK_PROCEED();
      }
    }));
  }

  // =====================================================================
  // Gating bottone Procedi
  // =====================================================================
  function checkProceed(){
    if(!el.procedi) return;

    const okNome  = el.nome ? validName(el.nome.value) : true;
    const okCogn  = el.cognome ? validName(el.cognome.value) : true;
    const okCFone = el.cfSingle ? runCFValidationSingle() : true;

    const vEst    = radioValue(el.estero);
    const okEst   = el.estero && el.estero.length>0 ? !!vEst : true;

    let okNasc = true;
    if(vEst){
      if(vEst==="si"||vEst==="true"||vEst==="1"){ okNasc = true; }
      else { okNasc = isSelected(el.regioneNascita) && isSelected(el.provinciaNascita) && isSelected(el.comuneNascita); }
    }

    const okRes = (el.provinciaRes ? isSelected(el.provinciaRes) : true) &&
                  (el.comuneRes ? isSelected(el.comuneRes) : true);

    let okTel = true;
    if(el.telefono){
      const res = VAL.validatePhone ? VAL.validatePhone(el.telefono.value, true)
                                    : { ok: /^\+?\d[\d-]{8,14}$/.test(el.telefono.value) };
      okTel = !!res.ok;
    }

    el.procedi.disabled = !(okNome && okCogn && okCFone && okEst && okNasc && okRes && okTel);
  }

  // Eventi che riconducono a checkProceed
  ["input","change","blur"].forEach(evt=>{
    el.nome && el.nome.addEventListener(evt, checkProceed);
    el.cognome && el.cognome.addEventListener(evt, checkProceed);
    el.cfSingle && el.cfSingle.addEventListener(evt, checkProceed);
    el.regioneNascita && el.regioneNascita.addEventListener(evt, checkProceed);
    el.provinciaNascita && el.provinciaNascita.addEventListener(evt, checkProceed);
    el.comuneNascita && el.comuneNascita.addEventListener(evt, checkProceed);
    el.provinciaRes && el.provinciaRes.addEventListener(evt, checkProceed);
    el.comuneRes && el.comuneRes.addEventListener(evt, checkProceed);
    el.telefono && el.telefono.addEventListener(evt, checkProceed);
    el.email1 && el.email1.addEventListener(evt, checkProceed);
    el.email2 && el.email2.addEventListener(evt, checkProceed);
    (el.genere||[]).forEach(r => r.addEventListener(evt, checkProceed));
    (el.estero||[]).forEach(r => r.addEventListener(evt, checkProceed));
    el.sessoNascita && el.sessoNascita.addEventListener(evt, checkProceed);
    el.dataNascita && el.dataNascita.addEventListener(evt, checkProceed);
  });

  DATA.ready?.then(()=>checkProceed());
  checkProceed();
})();
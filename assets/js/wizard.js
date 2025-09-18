(function(){
  const CFG = window.MASKERA_CONFIG;
  const VAL = window.MASKERA_VALIDATION;

  // === RIFERIMENTI DOM ===
  const el = {
    // riga 2
    wrapNome: document.getElementById("wrapNome"),
    nome: document.getElementById("nome"),
    wrapCognome: document.getElementById("wrapCognome"),
    cognome: document.getElementById("cognome"),

    // riga 3
    wrapGenere: document.getElementById("wrapGenere"),
    genere: document.querySelectorAll('input[name="genere"]'),
    wrapSessoNascita: document.getElementById("wrapSessoNascita"),
    sessoNascita: document.getElementById("sesso_nascita"),
    sessoNascitaErr: document.getElementById("sesso_nascita-error"),
    wrapDob: document.getElementById("wrapDob"),
    dob: document.getElementById("data_nascita"),

    // riga 4 (nascita)
    wrapEstero: document.getElementById("wrapEstero"),
    estero: document.querySelectorAll('input[name="nato_estero"]'),

    wrapBirthRight: document.getElementById("wrapBirthRight"),
    wrapPaeseNascita: document.getElementById("wrapPaeseNascita"),
    paeseNascita: document.getElementById("paese_nascita"),
    dlPaesi: document.getElementById("dl-paesi"),

    wrapRegioneNascita: document.getElementById("wrapRegioneNascita"),
    regioneNascita: document.getElementById("regione_nascita"),

    // riga 5 (solo IT)
    wrapProvNasc: document.getElementById("wrapProvNasc"),
    provNasc: document.getElementById("provincia_nascita"),
    wrapComuneNasc: document.getElementById("wrapComuneNasc"),
    comNasc: document.getElementById("comune_nascita"),

    // riga 6 (residenza)
    wrapProvRes: document.getElementById("wrapProvRes"),
    provRes: document.getElementById("provincia_res"),
    wrapComuneRes: document.getElementById("wrapComuneRes"),
    comRes: document.getElementById("comune_res"),

    // riga 7
    wrapTel1: document.getElementById("wrapTel1"),
    tel1: document.getElementById("telefono1"),
    wrapTel2: document.getElementById("wrapTel2"),
    tel2: document.getElementById("telefono2"),

    // riga 8
    wrapEmail1: document.getElementById("wrapEmail1"),
    email1: document.getElementById("email1"),
    wrapEmail2: document.getElementById("wrapEmail2"),
    email2: document.getElementById("email2"),

    // riga 9
    wrapDsa: document.getElementById("wrapDsa"),
    dsa: document.querySelectorAll('input[name="dsa"]')
  };

  const H = CFG.UI.hiddenClass;

  // === INIZIO: tutto nascosto (si sblocca progressivamente) ===
  [
    el.wrapNome, el.wrapCognome, el.wrapGenere, el.wrapDob, el.wrapEstero, el.wrapBirthRight,
    el.wrapPaeseNascita, el.wrapRegioneNascita, el.wrapProvNasc, el.wrapComuneNasc,
    el.wrapProvRes, el.wrapComuneRes, el.wrapTel1, el.wrapTel2, el.wrapEmail1, el.wrapEmail2, el.wrapDsa
  ].forEach(n => n && n.classList.add(H));

  // === UTILITY: blocca e rimuove spazi in tempo reale (tel/email) ===
  function blockSpaces(input){
    if(!input) return;
    input.addEventListener('keydown', (e) => { if(e.key === ' ') e.preventDefault(); });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text') || "";
      input.value = (input.value + text).replace(/\s+/g, '');
      input.dispatchEvent(new Event('input'));
    });
    input.addEventListener('input', () => {
      if(/\s/.test(input.value)) input.value = input.value.replace(/\s+/g, '');
    });
  }
  [el.tel1, el.tel2, el.email1, el.email2].forEach(blockSpaces);

  // === FLOW: Nome -> Cognome ===
  el.nome?.addEventListener("input", () => {
    const v = (el.nome.value || "").trim();
    const { ok, msg } = VAL.validateName(el.nome.value);
    VAL.setError(el.nome, ok ? "" : msg);
    if(v.length >= 1) el.wrapCognome.classList.remove(H); else el.wrapCognome.classList.add(H);
    checkProceed();
  });

  // === Cognome -> Genere ===
  el.cognome?.addEventListener("input", () => {
    const v = (el.cognome.value || "").trim();
    const { ok, msg } = VAL.validateName(el.cognome.value);
    VAL.setError(el.cognome, ok ? "" : msg);
    if(v.length >= 1) el.wrapGenere.classList.remove(H); else el.wrapGenere.classList.add(H);
    checkProceed();
  });

  // === Genere -> (se X chiedi sesso di nascita) -> Data di nascita ===
  el.genere.forEach(r => r.addEventListener("change", () => {
    const chosen = Array.from(el.genere).find(x=>x.checked)?.value || "";
    document.getElementById("genere-error").textContent = chosen ? "" : CFG.COPY.genereRequired;
    if(!chosen){ hideSessoNascita(); return; }
    if(chosen === "X"){ el.wrapSessoNascita.classList.remove(H); } else { hideSessoNascita(); }
    el.wrapDob.classList.remove(H);
    checkProceed();
  }));
  function hideSessoNascita(){
    el.wrapSessoNascita.classList.add(H);
    el.sessoNascita.value = "";
    el.sessoNascitaErr.textContent = "";
  }

  // === Data di nascita -> Estero? ===
  function handleDob(){
    const { ok, msg, warn } = VAL.validateDate(el.dob.value);
    VAL.setError(el.dob, ok ? "" : msg);
    const warnNode = document.getElementById("dob-warn");
    if(warnNode) warnNode.textContent = ok ? (warn||"") : "";
    if(ok) el.wrapEstero.classList.remove(H);
    checkProceed();
  }
  el.dob?.addEventListener("input", handleDob);
  el.dob?.addEventListener("change", handleDob);

  // === Estero -> Estero=Sì: Paese + SALTO a Residenza | Estero=No: Regione IT ===
  el.estero.forEach(r => r.addEventListener("change", () => {
    const chosen = Array.from(el.estero).find(x=>x.checked)?.value || "";
    const err = document.getElementById("estero-error");
    err.textContent = chosen ? "" : CFG.COPY.esteroRequired;
    if(!chosen) return;

    el.wrapBirthRight.classList.remove(H);

    if(chosen === "si"){
      // Estero: mostra Paese, nascondi campi nascita IT
      el.wrapPaeseNascita.classList.remove(H);
      el.wrapRegioneNascita.classList.add(H);
      el.wrapProvNasc.classList.add(H);
      el.wrapComuneNasc.classList.add(H);
      // Residenza subito
      el.wrapProvRes.classList.remove(H);
      el.wrapComuneRes.classList.remove(H);
    }else{
      // Italia: Regione -> Provincia -> Comune
      el.wrapPaeseNascita.classList.add(H);
      el.paeseNascita.value = "";
      document.getElementById("paesenasc-error").textContent = "";
      el.wrapRegioneNascita.classList.remove(H);
      // Chiudi residenza finché non completano nascita IT
      el.wrapProvRes.classList.add(H);
      el.wrapComuneRes.classList.add(H);
    }
    checkProceed();
  }));

  // === TELEFONO / EMAIL / DSA ===
  el.tel1?.addEventListener("input", () => {
    const { ok, msg } = VAL.validatePhone(el.tel1.value, true);
    document.getElementById("tel1-error").textContent = ok ? "" : msg;
    if(ok){ el.wrapEmail1.classList.remove(H); el.wrapEmail2.classList.remove(H); }
    checkProceed();
  });
  el.tel2?.addEventListener("input", () => {
    const { ok, msg } = VAL.validatePhone(el.tel2.value, false);
    document.getElementById("tel2-error").textContent = ok ? "" : msg;
    checkProceed();
  });

  el.email1?.addEventListener("input", () => {
    const { ok, msg } = VAL.validateEmail(el.email1.value, true);
    document.getElementById("email1-error").textContent = ok ? "" : msg;
    if(ok) el.wrapDsa.classList.remove(H);
    checkProceed();
  });
  el.email2?.addEventListener("input", () => {
    const { ok, msg } = VAL.validateEmail(el.email2.value, false);
    document.getElementById("email2-error").textContent = ok ? "" : msg;
    checkProceed();
  });

  el.dsa.forEach(r => r.addEventListener("change", () => {
    const chosen = Array.from(el.dsa).some(x=>x.checked);
    document.getElementById("dsa-error").textContent = chosen ? "" : CFG.COPY.dsaRequired;
    checkProceed();
  }));

  // === COMPLETENESS & PULSANTE GLOBALE ===
  function wizardIsComplete(){
    const nomeOk = VAL.validateName(el.nome.value).ok;
    const cognomeOk = VAL.validateName(el.cognome.value).ok;

    const gen = Array.from(el.genere).find(x=>x.checked)?.value;
    if(!gen) return false;
    if(gen === "X" && !el.sessoNascita.value) return false;

    const dobOk = VAL.validateDate(el.dob.value).ok;

    const est = Array.from(el.estero).find(x=>x.checked)?.value;
    if(!est) return false;

    let birthOk = false;
    if(est === "si"){
      birthOk = VAL.validateRequiredText(el.paeseNascita.value).ok;
    }else{
      const regOk = VAL.validateRequiredText(el.regioneNascita.value).ok;
      const provOk = VAL.validateRequiredText(el.provNasc.value).ok;
      const comOk  = VAL.validateRequiredText(el.comNasc.value).ok;
      birthOk = regOk && provOk && comOk;
    }

    const resOk = VAL.validateRequiredText(el.provRes.value).ok && VAL.validateRequiredText(el.comRes.value).ok;
    const tel1Ok = VAL.validatePhone(el.tel1.value, true).ok;
    const mail1Ok = VAL.validateEmail(el.email1.value, true).ok;
    const dsaChosen = Array.from(el.dsa).some(x=>x.checked);

    return nomeOk && cognomeOk && dobOk && birthOk && resOk && tel1Ok && mail1Ok && dsaChosen;
  }

  function checkProceed(){
    const gVal = Array.from(el.genere).find(x=>x.checked)?.value;
    if(gVal === "X"){
      el.sessoNascitaErr.textContent = el.sessoNascita.value ? "" : CFG.COPY.sessoNascRequired;
    }
    window.MASKERA_WIZARD_COMPLETE = wizardIsComplete();
    if(typeof window.MASKERA_CHECK_PROCEED === "function"){ window.MASKERA_CHECK_PROCEED(); }
  }

  // === CARICAMENTO DATI ESTERNI (/data/*.json) E COLLEGAMENTO CASCATE ===
  // datasets.js espone window.MASKERA_DATA = { ready: Promise, ... }
  const HOLDER = window.MASKERA_DATA;
  if(!HOLDER || !HOLDER.ready){
    // Se per qualche motivo datasets.js non è caricato, fermiamo qui in modo "silenzioso".
    return;
  }

  HOLDER.ready.then((DATA) => {
    // — helper per select —
    function fillSelect(select, items, getVal, getLabel, placeholder){
      if(!select) return;
      select.innerHTML = "";
      const opt0 = document.createElement("option");
      opt0.value = ""; opt0.textContent = placeholder || "Seleziona…";
      select.appendChild(opt0);
      items.forEach(it => {
        const o = document.createElement("option");
        o.value = getVal(it);
        o.textContent = getLabel(it);
        select.appendChild(o);
      });
    }

    // Popola: Regioni IT e Province Residenza (tutte)
    fillSelect(el.regioneNascita, DATA.regioni, r=>r.cod, r=>r.name, "Seleziona la regione…");
    fillSelect(el.provRes, DATA.utils.allProvinces(), p=>p.cod, p=>p.name, "Seleziona la provincia…");

    // Paese (fuzzy datalist) — estero
    el.paeseNascita?.addEventListener("input", () => {
      const q = el.paeseNascita.value || "";
      const list = DATA.utils.fuzzyFilter(DATA.countries, q, "name", 10);
      el.dlPaesi.innerHTML = "";
      list.forEach(c => {
        const o = document.createElement("option");
        o.value = c.name;
        el.dlPaesi.appendChild(o);
      });
      const { ok, msg } = VAL.validateRequiredText(el.paeseNascita.value);
      document.getElementById("paesenasc-error").textContent = ok ? "" : msg;

      // Residenza resta aperta per estero
      el.wrapProvRes.classList.remove(H);
      el.wrapComuneRes.classList.remove(H);

      checkProceed();
    });

    // ITALIA: Regione -> Provincia -> Comune (cascata nascita)
    el.regioneNascita?.addEventListener("change", () => {
      const reg = el.regioneNascita.value;
      const { ok, msg } = VAL.validateRequiredText(reg);
      document.getElementById("regionenasc-error").textContent = ok ? "" : msg;

      if(ok){
        const provs = DATA.utils.provincesByRegione(reg);
        fillSelect(el.provNasc, provs, p=>p.cod, p=>p.name, "Seleziona la provincia…");
        el.wrapProvNasc.classList.remove(H);
        // reset comuni
        fillSelect(el.comNasc, [], c=>c.cod, c=>c.name, "Seleziona il comune…");
        el.wrapComuneNasc.classList.add(H);
      }else{
        el.wrapProvNasc.classList.add(H);
        el.wrapComuneNasc.classList.add(H);
      }
      checkProceed();
    });

    el.provNasc?.addEventListener("change", () => {
      const prov = el.provNasc.value;
      const { ok, msg } = VAL.validateRequiredText(prov);
      document.getElementById("provnasc-error").textContent = ok ? "" : msg;

      if(ok){
        const cms = DATA.utils.comuniByProvincia(prov);
        fillSelect(el.comNasc, cms, c=>c.cod, c=>c.name, "Seleziona il comune…");
        el.wrapComuneNasc.classList.remove(H);
      }else{
        el.wrapComuneNasc.classList.add(H);
      }
      checkProceed();
    });

    el.comNasc?.addEventListener("change", () => {
      const com = el.comNasc.value;
      const { ok, msg } = VAL.validateRequiredText(com);
      document.getElementById("comnasc-error").textContent = ok ? "" : msg;

      if(ok){
        // Apri residenza quando nascita IT è completa
        el.wrapProvRes.classList.remove(H);
        el.wrapComuneRes.classList.remove(H);
      }
      checkProceed();
    });

    // RESIDENZA: Provincia -> Comune
    el.provRes?.addEventListener("change", () => {
      const prov = el.provRes.value;
      const { ok, msg } = VAL.validateRequiredText(prov);
      document.getElementById("provres-error").textContent = ok ? "" : msg;

      if(ok){
        const cms = DATA.utils.comuniByProvincia(prov);
        fillSelect(el.comRes, cms, c=>c.cod, c=>c.name, "Seleziona il comune…");
        el.wrapComuneRes.classList.remove(H);
      }else{
        el.wrapComuneRes.classList.add(H);
      }
      checkProceed();
    });

    el.comRes?.addEventListener("change", () => {
      const com = el.comRes.value;
      const { ok, msg } = VAL.validateRequiredText(com);
      document.getElementById("comres-error").textContent = ok ? "" : msg;

      if(ok){
        el.wrapTel1.classList.remove(H);
        el.wrapTel2.classList.remove(H);
      }
      checkProceed();
    });

    // Avvio: nessuna azione extra; la catena parte dal CF (gestita in index.html)
    // Facciamo un primo check per lo stato del bottone globale
    checkProceed();
  });

})();

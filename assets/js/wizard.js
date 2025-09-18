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
    sessoNascita: document.getElementById("sessoNascita"),
    sessoNascitaErr: document.getElementById("sessonasc-error"),
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

  // ... [CONTENUTO INVARIATO DEL TUO FILE — gestioni step, estero/italia, cascata, ecc.] ...

  // TELEFONO / EMAIL / DSA — validazioni in input (già presenti nel tuo file)
  // ...
  // Al termine del setup:
  //   checkProceed();
})();


// === v0.4 — CF (campo singolo) + telefono: normalizzazione ===
(function(){
  const CFG = window.MASKERA_CONFIG;
  const VAL = window.MASKERA_VALIDATION;
  const H = CFG.UI.hiddenClass;

  // CF opzionale nel wizard
  const cfInput = document.getElementById("codice_fiscale");
  const cfHint = document.getElementById("cf-hint");
  if(cfHint){
    cfHint.textContent = "Se lo inserisci: 16 caratteri alfanumerici. Controllo completo (mese/giorno, carattere di controllo, codice Belfiore).";
  }
  function runCFValidation(){
    if(!cfInput) return true;
    const val = (cfInput.value||"").toUpperCase();
    if(!val){
      VAL.setError(cfInput, ""); VAL.setWarning(cfInput, ""); return true;
    }
    const comuni = (window.MASKERA_DATA && window.MASKERA_DATA.comuni) || [];
    const res = VAL.validateCodiceFiscale(val, comuni);
    VAL.setError(cfInput, res.ok ? "" : (res.msg || CFG.COPY.invalidFormat));
    if(res.ok && comuni.length===0){
      VAL.setWarning(cfInput, "Verifica luogo di nascita (Belfiore) completata quando i dati saranno caricati.");
    }else{
      VAL.setWarning(cfInput, "");
    }
    return res.ok;
  }
  if(cfInput){
    cfInput.addEventListener("input", () => {
      cfInput.value = cfInput.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,16);
      runCFValidation();
    });
    cfInput.addEventListener("blur", runCFValidation);
    if(window.MASKERA_DATA && window.MASKERA_DATA.ready && typeof window.MASKERA_DATA.ready.then === "function"){
      window.MASKERA_DATA.ready.then(() => { if(cfInput.value) runCFValidation(); });
    }
  }

  // Hints telefono coerenti (senza toccare l’HTML)
  function setTelHint(wrapId, hintId){
    const wrap = document.getElementById(wrapId);
    const hint = document.getElementById(hintId) || (wrap && wrap.querySelector(".hint"));
    if(hint){ hint.textContent = "Niente spazi. Solo cifre; '+' opzionale all'inizio. 9–15 cifre."; }
  }
  setTelHint("wrapTel1","tel1-hint");
  setTelHint("wrapTel2","tel2-hint");

  // Normalizzazione su blur + revalidazione
  function attachPhone(input, required){
    if(!input) return;
    input.addEventListener("blur", () => {
      const n = VAL.normalizePhone(input.value);
      if(input.value !== n) input.value = n;
      const { ok, msg } = VAL.validatePhone(input.value, !!required);
      const id = input.getAttribute("aria-describedby") || "";
      const errId = id.split(" ").find(x => x.includes("tel") && x.includes("error"));
      if(errId){
        const node = document.getElementById(errId);
        if(node) node.textContent = ok ? "" : msg;
      }
      if(input.id === "telefono1" && ok){
        const elWrapEmail1 = document.getElementById("wrapEmail1");
        const elWrapEmail2 = document.getElementById("wrapEmail2");
        elWrapEmail1 && elWrapEmail1.classList.remove(H);
        elWrapEmail2 && elWrapEmail2.classList.remove(H);
      }
      if(typeof checkProceed === "function") { try { checkProceed(); } catch(e){} }
    });
  }
  attachPhone(document.getElementById("telefono1"), true);
  attachPhone(document.getElementById("telefono2"), false);
})();

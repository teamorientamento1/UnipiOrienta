/* Bootstrap app (progressive reveal 1-alla-volta) */
(function(){
  // Versione (su GitHub Pages funziona)
  fetch("version.json").then(r => r.json()).then(data=>{
    const el = document.getElementById("app-version");
    if(el) el.textContent = `Versione ${data.version} (build ${data.build})`;
    console.info(`Maschera v${data.version} — build ${data.build} — ${data.date}`);
  }).catch(()=>{ /* ok in contesto file:// */ });

  window.addEventListener("DOMContentLoaded", () => {
    // Step 2
    if (window.FieldHandlers?.initAnagrafica) {
      window.FieldHandlers.initAnagrafica();
    }

    const { qs, show, hide } = window.Dom;

    // --- Estero / Nascita / Residenza ---
    const grpEstero = qs("#group-estero");
    const esteroSi  = qs("#esteroSi");
    const esteroNo  = qs("#esteroNo");

    // Paese estero
    const grpPaeseEstero = qs("#group-paese-estero");
    const fldPaeseEstero = qs("#field-paese-estero");
    const paeseSel       = qs("#paeseEstero");
    const paeseSearch    = qs("#searchPaeseEstero");
    const hintPaese      = qs("#hint-paese-estero");

    // Nascita IT: Provincia -> Comune
    const grpNascita      = qs("#group-nascita");
    const fldProvNascita  = qs("#field-prov-nascita");
    const provNasSel      = qs("#provinciaNascita");
    const provNasSearch   = qs("#searchProvinciaNascita");
    const fldComNas       = qs("#field-comune-nascita");
    const comNasSel       = qs("#comuneNascita");
    const comNasSearch    = qs("#searchComuneNascita");

    // Residenza: Provincia -> Comune
    const grpRes          = qs("#group-residenza");
    const fldProvRes      = qs("#field-prov-res");
    const provResSel      = qs("#provinciaResidenza");
    const provResSearch   = qs("#searchProvinciaResidenza");
    const fldComRes       = qs("#field-comune-res");
    const comResSel       = qs("#comuneResidenza");
    const comResSearch    = qs("#searchComuneResidenza");

    // Stati componenti
    let esteroAPI = null;
    let nascitaAPI = null;
    let resAPI = null;

    // ---- Helper reveal "uno per volta" ----
    function resetNascitaStep() {
      // Mostra solo la Provincia di nascita
      show(grpNascita);
      show(fldProvNascita);
      hide(fldComNas);
      // Disabilita input di ricerca Comune finché la Provincia non è scelta
      if (comNasSearch) { comNasSearch.disabled = true; comNasSearch.value = ""; }
      if (comNasSel)    { comNasSel.value = ""; comNasSel.disabled = true; }
    }

    function resetResidenzaStep() {
      // Mostra solo la Provincia di residenza
      show(grpRes);
      show(fldProvRes);
      hide(fldComRes);
      if (comResSearch) { comResSearch.disabled = true; comResSearch.value = ""; }
      if (comResSel)    { comResSel.value = ""; comResSel.disabled = true; }
    }

    function maybeShowComuneNascita(provincia, comune) {
      // Se c'è una provincia selezionata ma il comune è vuoto → mostra solo il campo Comune nascita
      if (provincia && !comune) {
        show(fldComNas);
        if (comNasSearch) comNasSearch.disabled = false;
      }
      // Se scelto anche il comune → sblocca Residenza (solo Provincia)
      if (provincia && comune) {
        resetResidenzaStep();
      }
      // Se la provincia è stata deselezionata → nascondi di nuovo il comune
      if (!provincia) {
        hide(fldComNas);
        hide(grpRes);
      }
    }

    function maybeShowComuneResidenza(provincia, comune) {
      if (provincia && !comune) {
        show(fldComRes);
        if (comResSearch) comResSearch.disabled = false;
      }
      if (!provincia) {
        hide(fldComRes);
      }
    }

    function onEsteroChange(){
      if (esteroSi?.checked){
        // Flusso ESTERO:
        // 1) Mostra Paese; 2) dopo scelta Paese -> mostra Residenza (solo Provincia)
        show(grpPaeseEstero);
        hide(grpNascita);
        hide(grpRes);
        // Se i paesi non sono pronti, caricali
        if (!esteroAPI) ensureCountriesLoaded();
        // Se già presente una scelta Paese, prepara Residenza (solo Provincia)
        if (paeseSel?.value) resetResidenzaStep();
      } else if (esteroNo?.checked){
        // Flusso ITALIA:
        // 1) Mostra Nascita solo Provincia; 2) dopo scelta Provincia -> mostra Comune; 3) dopo Comune -> Residenza (solo Provincia)
        hide(grpPaeseEstero);
        hide(grpRes);
        resetNascitaStep();
        if (!nascitaAPI) ensureNascitaLoaded();
      } else {
        hide(grpPaeseEstero);
        hide(grpNascita);
        hide(grpRes);
      }
    }

    // Attacca SUBITO gli eventi, senza attendere i dati
    esteroSi?.addEventListener("change", onEsteroChange);
    esteroNo?.addEventListener("change", onEsteroChange);
    paeseSel?.addEventListener("change", () => {
      if (esteroSi?.checked && paeseSel.value) {
        resetResidenzaStep(); // Paese scelto: sblocca Residenza (solo Provincia)
        if (!resAPI) ensureResidenzaLoaded();
      }
    });

    // ---- Lazy init dei componenti (con try/catch) ----
    async function ensureCountriesLoaded(){
      if (esteroAPI || !window.SelectCascade) return;
      try{
        esteroAPI = await window.SelectCascade.initPaesi({
          selectEl: paeseSel,
          searchEl: paeseSearch
        });
        esteroAPI.onChange(() => {
          if (esteroSi?.checked && paeseSel.value) {
            resetResidenzaStep();
            if (!resAPI) ensureResidenzaLoaded();
          }
        });
      }catch(e){
        console.error("Errore caricamento paesi:", e);
        if (hintPaese) hintPaese.textContent = "Impossibile caricare la lista dei paesi. Controlla data/paesi_esteri.json o data/demo/demo_paesi_esteri.json.";
      }
    }

    async function ensureNascitaLoaded(){
      if (nascitaAPI || !window.SelectCascade) return;
      try{
        nascitaAPI = await window.SelectCascade.initProvinceComune({
          provinciaSelect: provNasSel,
          provinciaSearch: provNasSearch,
          comuneSelect: comNasSel,
          comuneSearch: comNasSearch
        });
        // Subito dopo init: mostra solo la Provincia di nascita
        resetNascitaStep();

        // Ogni cambiamento su Provincia/Comune nascita
        nascitaAPI.onChange(({provincia, comune}) => {
          maybeShowComuneNascita(provincia, comune);
        });
      }catch(e){
        console.error("Errore caricamento province/comuni (nascita):", e);
      }
    }

    async function ensureResidenzaLoaded(){
      if (resAPI || !window.SelectCascade) return;
      try{
        resAPI = await window.SelectCascade.initProvinceComune({
          provinciaSelect: provResSel,
          provinciaSearch: provResSearch,
          comuneSelect: comResSel,
          comuneSearch: comResSearch
        });
        // Subito dopo init, la logica di reveal la governiamo noi: mostriamo solo la Provincia
        show(grpRes);
        show(fldProvRes);
        hide(fldComRes);
        if (comResSearch) { comResSearch.disabled = true; comResSearch.value = ""; }
        if (comResSel)    { comResSel.value = ""; comResSel.disabled = true; }

        // Ogni cambiamento su Provincia/Comune residenza
        resAPI.onChange(({provincia, comune}) => {
          maybeShowComuneResidenza(provincia, comune);
        });
      }catch(e){
        console.error("Errore caricamento province/comuni (residenza):", e);
      }
    }

    // Avvia pre-caricamenti in background
    (async () => {
      if (!window.SelectCascade) {
        console.warn("SelectCascade.js non caricato — verifica percorso js/components/SelectCascade.js");
      } else {
        // Non inizializziamo subito nascita/residenza: lo facciamo quando servono.
        ensureCountriesLoaded(); // è leggero; ok farlo subito
      }
    })();

    // Stato iniziale: nascosti finché non scelta opzione estero (Step 2 decide quando mostrare "#group-estero")
    hide(grpPaeseEstero);
    hide(grpNascita);
    hide(grpRes);
    hide(fldComNas);
    hide(fldComRes);
  });
})();

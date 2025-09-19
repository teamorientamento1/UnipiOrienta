/* Bootstrap app (robusta) */
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

    const grpPaeseEstero = qs("#group-paese-estero");
    const paeseSel = qs("#paeseEstero");
    const paeseSearch = qs("#searchPaeseEstero");
    const hintPaese = qs("#hint-paese-estero");

    const grpNascita = qs("#group-nascita");
    const provNasSel = qs("#provinciaNascita");
    const provNasSearch = qs("#searchProvinciaNascita");
    const comNasSel = qs("#comuneNascita");
    const comNasSearch = qs("#searchComuneNascita");

    const grpRes = qs("#group-residenza");
    const provResSel = qs("#provinciaResidenza");
    const provResSearch = qs("#searchProvinciaResidenza");
    const comResSel = qs("#comuneResidenza");
    const comResSearch = qs("#searchComuneResidenza");

    // Stati
    let esteroAPI = null;
    let nascitaAPI = null;
    let resAPI = null;

    // Attacca SUBITO gli eventi, senza attendere i dati
    function onEsteroChange(){
      if (esteroSi?.checked){
        show(grpPaeseEstero);
        hide(grpNascita);
        // mostra residenza solo quando c'è una scelta nel paese (anche ALTRO)
        if (paeseSel?.value) show(grpRes); else hide(grpRes);

        // se i paesi non sono pronti, prova a (re)init
        if (!esteroAPI) ensureCountriesLoaded();
      } else if (esteroNo?.checked){
        hide(grpPaeseEstero);
        show(grpNascita);
        // residenza solo quando ho prov+comune nascita (o forza se già pronto)
        if (nascitaAPI && nascitaAPI.comune) show(grpRes); else hide(grpRes);

        if (!nascitaAPI) ensureNascitaLoaded();
      } else {
        hide(grpPaeseEstero);
        hide(grpNascita);
        hide(grpRes);
      }
    }

    esteroSi?.addEventListener("change", onEsteroChange);
    esteroNo?.addEventListener("change", onEsteroChange);
    paeseSel?.addEventListener("change", () => { if (esteroSi?.checked && paeseSel.value) show(grpRes); });

    // Nascita IT: quando cambia provincia/comune → valuta residenza
    function wireNascitaResidenza(){
      if (!nascitaAPI) return;
      nascitaAPI.onChange(({provincia, comune}) => {
        if (esteroNo?.checked && provincia && comune) show(grpRes);
      });
    }

    // Lazy init dei componenti (con try/catch)
    async function ensureCountriesLoaded(){
      if (esteroAPI || !window.SelectCascade) return;
      try{
        esteroAPI = await window.SelectCascade.initPaesi({
          selectEl: paeseSel,
          searchEl: paeseSearch
        });
        esteroAPI.onChange(() => { if (esteroSi?.checked && paeseSel.value) show(grpRes); });
      }catch(e){
        console.error("Errore caricamento paesi:", e);
        if (hintPaese) hintPaese.textContent = "Impossibile caricare la lista dei paesi. Controlla che data/paesi_esteri.json o data/demo/demo_paesi_esteri.json esista.";
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
        wireNascitaResidenza();
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
      }catch(e){
        console.error("Errore caricamento province/comuni (residenza):", e);
      }
    }

    // Avvia in background (senza bloccare gli eventi)
    (async () => {
      if (!window.SelectCascade) {
        console.warn("SelectCascade.js non caricato — verifica percorso js/components/SelectCascade.js");
      } else {
        ensureCountriesLoaded();
        ensureNascitaLoaded();
        ensureResidenzaLoaded();
      }
    })();

    // All’avvio lascio nascosti finché non scelto estero
    hide(grpPaeseEstero);
    hide(grpNascita);
    hide(grpRes);

    // NB: il gruppo "estero" viene già mostrato da Step 2 quando data+genere sono validi.
    // Se vuoi forzare per test, togli hidden manualmente dal DOM.
  });
})();

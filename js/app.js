/* Bootstrap app */
(function(){
  // Versione (su GitHub Pages funziona)
  fetch("version.json").then(r => r.json()).then(data=>{
    const el = document.getElementById("app-version");
    if(el) el.textContent = `Versione ${data.version} (build ${data.build})`;
    console.info(`Maschera v${data.version} — build ${data.build} — ${data.date}`);
  }).catch(()=>{ /* ok in contesto file:// */ });

  // Inizializza dopo che il DOM è pronto (script caricati con defer)
  window.addEventListener("DOMContentLoaded", async () => {
    // Step 2
    if (window.FieldHandlers?.initAnagrafica) {
      window.FieldHandlers.initAnagrafica();
    }

    // --- Step 3: Flow Estero/Nascita/Residenza ---
    const { qs, show, hide } = window.Dom;

    // elementi
    const grpEstero = qs("#group-estero");
    const esteroSi  = qs("#esteroSi");
    const esteroNo  = qs("#esteroNo");

    const grpPaeseEstero = qs("#group-paese-estero");
    const paeseSel = qs("#paeseEstero");
    const paeseSearch = qs("#searchPaeseEstero");

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

    // inizializza componenti selezione
    // Paesi esteri
    const esteroAPI = await window.SelectCascade.initPaesi({
      selectEl: paeseSel,
      searchEl: paeseSearch
    });

    // Province/Comuni nascita
    const nascitaAPI = await window.SelectCascade.initProvinceComune({
      provinciaSelect: provNasSel,
      provinciaSearch: provNasSearch,
      comuneSelect: comNasSel,
      comuneSearch: comNasSearch
    });

    // Province/Comuni residenza
    const resAPI = await window.SelectCascade.initProvinceComune({
      provinciaSelect: provResSel,
      provinciaSearch: provResSearch,
      comuneSelect: comResSel,
      comuneSearch: comResSearch
    });

    // Regole di reveal in base a estero
    function onEsteroChange(){
      if (esteroSi.checked){
        // Estero = Sì -> mostra selezione Paese, nascondi nascita IT
        show(grpPaeseEstero);
        hide(grpNascita);
        // Residenza appare quando scelgo il Paese (anche "ALTRO")
        if (paeseSel.value) show(grpRes); else hide(grpRes);
      } else if (esteroNo.checked){
        // Estero = No -> mostra Nascita IT; Residenza appare dopo scelta Comune nascita
        hide(grpPaeseEstero);
        show(grpNascita);
        // Se ho già comune nascita, posso mostrare Residenza
        if (nascitaAPI.comune) show(grpRes); else hide(grpRes);
      } else {
        hide(grpPaeseEstero);
        hide(grpNascita);
        hide(grpRes);
      }
    }

    // Eventi estero
    esteroSi.addEventListener("change", onEsteroChange);
    esteroNo.addEventListener("change", onEsteroChange);

    // Evento su Paese estero: appena scelto → mostra Residenza
    esteroAPI.onChange(() => {
      if (esteroSi.checked && paeseSel.value) show(grpRes);
    });

    // Evento su Nascita IT: quando Comune valido → mostra Residenza
    nascitaAPI.onChange(({provincia, comune}) => {
      if (esteroNo.checked && provincia && comune) show(grpRes);
    });

    // All’avvio: lasciare nascosti fino a scelta esplicita
    hide(grpPaeseEstero);
    hide(grpNascita);
    hide(grpRes);
  });
})();

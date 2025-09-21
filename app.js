/* Bootstrap app */
(function(){
  document.addEventListener("DOMContentLoaded", () => {
    
    // --- Caricamento versione ---
    fetch("version.json").then(r => r.json()).then(data => {
      const el = document.getElementById("app-version");
      if(el) el.textContent = `Versione ${data.version} (build ${data.build})`;
    }).catch(()=>{/* ignore */});

    // --- Inizializzazione moduli ---
    if (window.FieldHandlers?.initAnagrafica) {
      window.FieldHandlers.initAnagrafica();
    }
    if (!window.SelectCascade) {
      return console.error("SelectCascade.js non è stato caricato. Le sezioni geografiche non funzioneranno.");
    }
    
    const { qs, show, hide } = window.Dom;

    const grpEstero = qs("#group-estero");
    const esteroSi  = qs("#esteroSi");
    const esteroNo  = qs("#esteroNo");
    const grpPaeseEstero = qs("#group-paese-estero");
    const paeseSel = qs("#paeseEstero");
    const grpNascita = qs("#group-nascita");
    const fldComuneNascita = qs("#field-comune-nascita");
    const grpResidenza = qs("#group-residenza");
    const fldComuneResidenza = qs("#field-comune-res");
    
    let nascitaAPI = null;
    let residenzaAPI = null;
    let paesiLoaded = false;

    function onEsteroChange(){
      hide(grpPaeseEstero);
      hide(grpNascita);
      hide(grpResidenza);

      if (esteroSi.checked){
        show(grpPaeseEstero);
        if (!paesiLoaded) {
          window.SelectCascade.initPaesi('paeseEstero').then(() => {
            paesiLoaded = true;
          });
        }
      } else if (esteroNo.checked){
        show(grpNascita);
        if (!nascitaAPI) {
          nascitaAPI = window.SelectCascade.initProvinceComune({
            provinciaSelectId: 'provinciaNascita',
            comuneSelectId: 'comuneNascita',
            fieldComuneId: 'field-comune-nascita',
            defaultValue: 'Pisa (PI)'
          });
          nascitaAPI.onChange(({ provincia, comune }) => {
            if (provincia && comune) {
              show(grpResidenza);
              if (!residenzaAPI) {
                 residenzaAPI = window.SelectCascade.initProvinceComune({
                    provinciaSelectId: 'provinciaResidenza',
                    comuneSelectId: 'comuneResidenza',
                    fieldComuneId: 'field-comune-res',
                    defaultValue: 'Pisa (PI)'
                 });
              }
            } else {
              hide(grpResidenza);
            }
          });
        }
      }
    }

    esteroSi.addEventListener("change", onEsteroChange);
    esteroNo.addEventListener("change", onEsteroChange);
    
    paeseSel.addEventListener("change", () => {
        if(paeseSel.value) {
            show(grpResidenza);
            if (!residenzaAPI) {
                residenzaAPI = window.SelectCascade.initProvinceComune({
                    provinciaSelectId: 'provinciaResidenza',
                    comuneSelectId: 'comuneResidenza',
                    fieldComuneId: 'field-comune-res',
                    defaultValue: 'Pisa (PI)'
                });
            }
        } else {
            hide(grpResidenza);
        }
    });

    hide(grpPaeseEstero);
    hide(grpNascita);
    hide(grpResidenza);
    hide(fldComuneNascita);
    hide(fldComuneResidenza);
    
    if (window.Modal) { window.Modal.init(); }
    if (window.AdvancedValidator) { window.AdvancedValidator.init(); }
  });
})();
/**
 * advanced-validator.js
 * Gestisce le validazioni avanzate e incrociate con feedback specifico:
 * 1. Coerenza anagrafica vs. Codice Fiscale (con omocodia).
 * 2. Coerenza geografica Residenza vs. Scuola.
 */
(function() {
  if (!window.CodiceFiscaleCalculator || !window.Dom || !window.Modal) {
    return console.error("ERRORE CRITICO: Dipendenze mancanti per AdvancedValidator.");
  }
  
  const { qs } = window.Dom;
  let isInitialized = false;

  const validationStates = {
    cf: { isOverridden: false, warningState: 0, timer: null },
    geo: { isOverridden: false, warningState: 0, timer: null }
  };

  let anagraficaFields, cfTrigger, geoTrigger, scuolaSection, scuolaFields;

  function blockScuolaSection() {
    if (scuolaSection) scuolaSection.classList.add('section--disabled');
    if (scuolaFields) scuolaFields.forEach(field => field.disabled = true);
  }

  function unblockScuolaSection() {
    if (scuolaSection) scuolaSection.classList.remove('section--disabled');
    if (scuolaFields) scuolaFields.forEach(field => field.disabled = false);
  }
  
  function clearAllErrors() {
    const fieldIds = ['field-cf', 'field-nome', 'field-cognome', 'field-datanascita', 'field-genere', 'field-comune-nascita', 'field-paese-estero', 'field-prov-res', 'field-prov-scuola'];
    fieldIds.forEach(id => {
        const field = qs(`#${id}`);
        if (field) window.Dom.clearError(field);
    });
  }

  function analizzaDiscrepanzaCF(userData, cfInserito) {
    const cfCorretto = window.CodiceFiscaleCalculator.calculate(userData);
    if (!cfCorretto) return { hasError: false };

    const cfInseritoParsed = window.CodiceFiscaleCalculator.parse(cfInserito);
    const cfCorrettoParsed = window.CodiceFiscaleCalculator.parse(cfCorretto);
    
    if (!cfInseritoParsed || !cfCorrettoParsed) return { hasError: false };

    let errors = [];
    let conflictingFieldIds = ['field-cf'];

    if (cfInseritoParsed.codiceCognome !== cfCorrettoParsed.codiceCognome) {
      errors.push("il **cognome**");
      conflictingFieldIds.push('field-cognome');
    }
    if (cfInseritoParsed.codiceNome !== cfCorrettoParsed.codiceNome) {
      errors.push("il **nome**");
      conflictingFieldIds.push('field-nome');
    }
    if (cfInseritoParsed.codiceAnno !== cfCorrettoParsed.codiceAnno || 
        cfInseritoParsed.codiceMese !== cfCorrettoParsed.codiceMese || 
        cfInseritoParsed.codiceGiorno !== cfCorrettoParsed.codiceGiorno) {
      errors.push("la **data di nascita** o il **genere**");
      conflictingFieldIds.push('field-datanascita', 'field-genere');
    }
    if (cfInseritoParsed.codiceBelfiore !== cfCorrettoParsed.codiceBelfiore) {
      errors.push("il **luogo di nascita**");
      conflictingFieldIds.push('field-comune-nascita', 'field-paese-estero');
    }
    
    if (errors.length === 0) return { hasError: false };

    let finalMessage = "I seguenti dati non sembrano coerenti con il Codice Fiscale: " + errors.join(', ') + ". Per favore, ricontrolla i campi evidenziati.";
    return { hasError: true, message: finalMessage, fields: conflictingFieldIds };
  }

  function runCfValidation() {
    clearAllErrors();
    const state = validationStates.cf;
    if (state.isOverridden) return;

    const userData = {
      nome: document.getElementById('nome').value,
      cognome: document.getElementById('cognome').value,
      dataNascita: document.getElementById('dataNascita').value,
      genere: document.getElementById('genere').value,
    };
    
    const esteroNoRadio = document.getElementById('esteroNo');
    if (esteroNoRadio.checked) {
      const comuneSelect = document.getElementById('comuneNascita');
      const selectedOption = comuneSelect.options[comuneSelect.selectedIndex];
      userData.codiceBelfiore = selectedOption ? selectedOption.dataset.belfiore : null;
    } else {
      const paeseSelect = document.getElementById('paeseEstero');
      const selectedOption = paeseSelect.options[paeseSelect.selectedIndex];
      userData.codiceBelfiore = selectedOption ? selectedOption.dataset.belfiore : null;
    }
    
    const cfInserito = Array.from(document.querySelectorAll('.cf-segment')).map(input => input.value).join('').toUpperCase();

    if (!userData.nome || !userData.cognome || !userData.dataNascita || !userData.genere || !userData.codiceBelfiore || cfInserito.length !== 16) {
      return;
    }
    
    const cfCalcolato = CodiceFiscaleCalculator.calculate(userData);
    let isValid = (cfCalcolato === cfInserito);

    if (!isValid && cfCalcolato) {
      const variazioni = CodiceFiscaleCalculator.generaVariazioniOmocodia(cfCalcolato);
      if (variazioni.includes(cfInserito)) {
        isValid = true;
        console.log("Rilevato caso di omocodia valido.");
      }
    }
    
    if (isValid) {
      if (!validationStates.geo.isOverridden && document.getElementById('provinciaResidenza').value === document.getElementById('provinciaScuola').value) {
        unblockScuolaSection();
      }
    } else {
      const risultato = analizzaDiscrepanzaCF(userData, cfInserito);
      blockScuolaSection();
      risultato.fields.forEach(fieldId => {
          const field = qs(`#${fieldId}`);
          if(field) window.Dom.setError(field);
      });
      
      const popupTitle = "Controllo Dati Specifico";
      if (state.warningState === 2) {
        window.Modal.show(popupTitle, risultato.message, { 
          showProceed: true,
          onProceed: () => { state.isOverridden = true; unblockScuolaSection(); clearAllErrors(); }
        });
      } else {
        window.Modal.show(popupTitle, risultato.message, { 
          onClose: () => {
            clearTimeout(state.timer);
            state.timer = setTimeout(() => { state.warningState = 2; unblockScuolaSection(); }, 8000);
          }
        });
        state.warningState = 1;
      }
    }
  }

  function runGeoValidation() {
    const state = validationStates.geo;
    if (state.isOverridden) return;

    const residenzaProv = document.getElementById('provinciaResidenza').value;
    const scuolaProv = document.getElementById('provinciaScuola').value;

    if (!residenzaProv || !scuolaProv || residenzaProv === scuolaProv) {
      return;
    }

    blockScuolaSection();
    window.Dom.setError(qs('#field-prov-res'));
    window.Dom.setError(qs('#field-prov-scuola'));

    if (state.warningState === 2) {
      window.Modal.show("Controllo Coerenza Geografica", "La provincia della scuola è ancora diversa da quella di residenza. Se sei sicuro, puoi procedere.", { 
        showProceed: true,
        onProceed: () => { state.isOverridden = true; unblockScuolaSection(); clearAllErrors(); }
      });
    } else {
      window.Modal.show("Controllo Coerenza Geografica", "Attenzione: la provincia della scuola selezionata è diversa da quella di residenza. I dati sono corretti?", {
        onClose: () => {
          clearTimeout(state.timer);
          state.timer = setTimeout(() => { state.warningState = 2; unblockScuolaSection(); }, 8000);
        }
      });
      state.warningState = 1;
    }
  }

  function onAnagraficaChange(event) {
    Object.values(validationStates).forEach(state => {
      state.isOverridden = false;
      state.warningState = 0;
      clearTimeout(state.timer);
    });
    unblockScuolaSection();
    clearAllErrors();
  }

  function init() {
    if (isInitialized) return;
    
    const tryInit = () => {
      anagraficaFields = Array.from(document.querySelectorAll('#section-anagrafica input, #section-anagrafica select'));
      scuolaSection = document.getElementById('section-scuola');
      scuolaFields = Array.from(scuolaSection.querySelectorAll('input, select'));
      cfTrigger = document.getElementById('regioneScuola');
      geoTrigger = document.getElementById('provinciaScuola');

      if (!scuolaSection || !cfTrigger || !geoTrigger || anagraficaFields.length === 0) {
        setTimeout(tryInit, 100);
        return;
      }

      cfTrigger.addEventListener('focus', runCfValidation);
      geoTrigger.addEventListener('change', runGeoValidation);
      anagraficaFields.forEach(field => field.addEventListener('input', onAnagraficaChange));

      isInitialized = true;
      console.log("Modulo di validazione avanzato inizializzato.");
    };

    tryInit();
  }

  window.AdvancedValidator = {
    init: init
  };
})();
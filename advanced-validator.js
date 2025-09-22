/**
 * advanced-validator.js
 * Gestisce le validazioni avanzate e incrociate con feedback specifico.
 */
(function() {
  if (!window.CodiceFiscaleCalculator || !window.Dom || !window.Modal) {
    return console.error("ERRORE CRITICO: Dipendenze mancanti per AdvancedValidator.");
  }
  
  const { qs, setOk, setError, clearError } = window.Dom;
  let isInitialized = false;

  const ANAGRAFICA_FIELD_IDS = [
    'field-cf', 'field-nome', 'field-cognome', 'field-datanascita', 
    'field-genere', 'field-comune-nascita', 'field-paese-estero'
  ];

  const validationStates = {
    cf: { isOverridden: false, warningState: 0, timer: null }
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
    const fieldIds = ['field-nome', 'field-cognome', 'field-datanascita', 'field-genere', 'field-comune-nascita', 'field-paese-estero', 'field-prov-res', 'field-prov-scuola'];
    fieldIds.forEach(id => {
      const field = qs(`#${id}`);
      if (field) clearError(field);
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

    if (cfInseritoParsed.codiceCognome !== cfCorrettoParsed.codiceCognome) errors.push("il **cognome**"), conflictingFieldIds.push('field-cognome');
    if (cfInseritoParsed.codiceNome !== cfCorrettoParsed.codiceNome) errors.push("il **nome**"), conflictingFieldIds.push('field-nome');
    if (cfInseritoParsed.codiceAnno !== cfCorrettoParsed.codiceAnno || cfInseritoParsed.codiceMese !== cfCorrettoParsed.codiceMese || cfInseritoParsed.codiceGiorno !== cfCorrettoParsed.codiceGiorno) errors.push("la **data di nascita** o il **genere**"), conflictingFieldIds.push('field-datanascita', 'field-genere');
    if (cfInseritoParsed.codiceBelfiore !== cfCorrettoParsed.codiceBelfiore) errors.push("il **luogo di nascita**"), conflictingFieldIds.push('field-comune-nascita', 'field-paese-estero');
    
    if (errors.length === 0) return { hasError: false };
    return { hasError: true, message: "I seguenti dati non sembrano coerenti con il Codice Fiscale: " + errors.join(', ') + ". Per favore, ricontrolla.", fields: conflictingFieldIds };
  }

  function runCfValidation() {
    clearAllErrors();
    const state = validationStates.cf;
    if (state.isOverridden) {
      unblockScuolaSection();
      return;
    }

    const userData = {
      nome: document.getElementById('nome').value,
      cognome: document.getElementById('cognome').value,
      dataNascita: document.getElementById('dataNascita').value,
      genere: document.getElementById('genere').value,
    };
    
    const isEstero = document.getElementById('esteroSi').checked;
    const luogoNascitaSelect = document.getElementById(isEstero ? 'paeseEstero' : 'comuneNascita');
    const selectedOption = luogoNascitaSelect.options[luogoNascitaSelect.selectedIndex];
    userData.codiceBelfiore = selectedOption ? selectedOption.dataset.belfiore : null;
    
    const cfInserito = Array.from(document.querySelectorAll('.cf-segment')).map(input => input.value).join('').toUpperCase();

    if (!userData.nome || !userData.cognome || !userData.dataNascita || !userData.genere || !userData.codiceBelfiore || cfInserito.length !== 16) {
      blockScuolaSection();
      return;
    }
    
    const cfCalcolato = CodiceFiscaleCalculator.calculate(userData);
    let isValid = (cfCalcolato === cfInserito) || (cfCalcolato && CodiceFiscaleCalculator.generaVariazioniOmocodia(cfCalcolato).includes(cfInserito));
    
    if (isValid) {
      state.warningState = 0;
      clearTimeout(state.timer);
      ANAGRAFICA_FIELD_IDS.forEach(id => {
        const field = qs(`#${id}`);
        if (field) setOk(field, id === 'field-cf' ? '' : 'Dato coerente');
      });
      unblockScuolaSection();
    } else {
      const risultato = analizzaDiscrepanzaCF(userData, cfInserito);
      const popupTitle = "Dati Anagrafici Incoerenti";

      risultato.fields.forEach(fieldId => {
          const field = qs(`#${fieldId}`);
          if(field) setError(field, 'Dato non coerente');
      });
      
      blockScuolaSection();

      if (state.warningState >= 1) {
        window.Modal.show(
          popupTitle,
          "I dati inseriti risultano ancora incoerenti. Se ritieni che siano corretti, puoi procedere comunque.",
          { 
            showProceed: true,
            // ✅ MODIFICA: Nasconde il pulsante "OK, ho capito"
            showClose: false,
            onProceed: () => { 
              state.isOverridden = true; 
              unblockScuolaSection(); 
              clearAllErrors();
              ANAGRAFICA_FIELD_IDS.forEach(id => setOk(qs(`#${id}`), 'Dato accettato'));
            }
          }
        );
      } else {
        window.Modal.show(
          popupTitle,
          // ✅ MODIFICA: Cambiato il testo per essere meno specifico sul tempo.
          risultato.message + " La sezione successiva verrà sbloccata a breve per darti il tempo di ricontrollare i dati."
        );
        state.warningState = 1;
        clearTimeout(state.timer);
        state.timer = setTimeout(() => {
          unblockScuolaSection();
        }, 8000);
      }
    }
  }

  function runGeoValidation() {
    const residenzaProv = document.getElementById('provinciaResidenza').value;
    const scuolaProv = document.getElementById('provinciaScuola').value;
    
    const fieldResidenza = qs('#field-prov-res');
    const fieldScuola = qs('#field-prov-scuola');

    if (!residenzaProv || !scuolaProv) return;

    clearError(fieldResidenza);
    clearError(fieldScuola);

    if (residenzaProv === scuolaProv) {
      setOk(fieldResidenza, 'Province coerenti');
      setOk(fieldScuola, '');
    } else {
      setError(fieldResidenza, 'Provincia diversa da quella della scuola');
      setError(fieldScuola, '');
      
      window.Modal.show(
        "Verifica Dati", 
        "La provincia di residenza non coincide con quella della scuola. Ti invitiamo a verificare che i dati siano corretti.",
        { closeText: "OK, ho capito" }
      );
    }
  }

  function onAnagraficaChange(event) {
    const state = validationStates.cf;
    state.isOverridden = false;
    state.warningState = 0;
    clearTimeout(state.timer);
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
    };

    tryInit();
  }

  window.AdvancedValidator = {
    init: init
  };
})();
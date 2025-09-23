/**
 * form-submit-handler.js
 * Versione finale di produzione
 */
(function() {
  document.addEventListener('DOMContentLoaded', () => {

    const submitBtn = document.getElementById('submit-btn');
    if (!submitBtn) return;
    
    // ✅ NUOVO: Flag per gestire il cooldown del disallineamento geografico
    let userAcknowledgedGeoWarning = false;

    const requiredFieldIds = [
      'nome', 'cognome', 'dataNascita', 'genere', 'comuneResidenza', 'plessoScuola', 'emailPrimaria'
    ];

    const checkFormCompleteness = () => {
      const allFieldsFilled = requiredFieldIds.every(id => {
        const field = document.getElementById(id);
        return field && field.value.trim() !== '';
      });
      const isEstero = document.getElementById('esteroSi').checked;
      const luogoNascitaId = isEstero ? 'paeseEstero' : 'comuneNascita';
      const luogoNascitaFilled = document.getElementById(luogoNascitaId)?.value.trim() !== '';
      const cfCompleto = document.querySelectorAll('.cf-segment');
      const cfValue = Array.from(cfCompleto).map(input => input.value).join('');
      const cfIsFilled = cfValue.length === 16;
      const emailPrimariaField = document.getElementById('emailPrimaria');
      const isEmailValid = window.Validators.isValidEmail(emailPrimariaField.value);
      submitBtn.disabled = !(allFieldsFilled && luogoNascitaFilled && cfIsFilled && isEmailValid);
    };

    const fieldsToWatch = document.querySelectorAll('form input, form select');
    fieldsToWatch.forEach(field => {
      const listener = () => {
        checkFormCompleteness();
        // Se l'utente cambia un dato, deve rivedere l'avviso
        userAcknowledgedGeoWarning = false;
      };
      field.addEventListener('input', listener);
      field.addEventListener('change', listener);
    });

    submitBtn.addEventListener('click', async () => {
      if (submitBtn.dataset.disabledForCooldown === 'true') {
        return;
      }
      
      const errorFields = document.querySelectorAll('.field--error');
      const errorFieldIds = new Set(Array.from(errorFields).map(f => f.id));
      const isGeoResError = errorFieldIds.has('field-prov-res');
      const isGeoScuolaError = errorFieldIds.has('field-prov-scuola');
      const isOnlyGeoError = errorFieldIds.size > 0 && errorFieldIds.size === (isGeoResError ? 1 : 0) + (isGeoScuolaError ? 1 : 0);

      // ✅ LOGICA CORRETTA: si attiva solo se c'è l'errore geografico E l'utente non ha già aspettato
      if (isOnlyGeoError && !userAcknowledgedGeoWarning) {
        window.Modal.show(
          "Verifica Coerenza Dati",
          "La provincia di residenza non coincide con quella della scuola. Per sicurezza, il pulsante di iscrizione verrà riattivato tra 8 secondi per darti il tempo di ricontrollare.",
          { closeText: "OK, ho capito" }
        );
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.dataset.disabledForCooldown = 'true';
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          delete submitBtn.dataset.disabledForCooldown;
          // L'utente ha scontato la "pena", ora può procedere
          userAcknowledgedGeoWarning = true;
        }, 8000);
        return;
      }
      
      if (errorFields.length > 0 && !isOnlyGeoError) {
        window.Modal.show(
          "Attenzione",
          "Ci sono ancora dei campi con errori o non validi. Correggili prima di procedere.",
          { closeText: "OK, correggo" }
        );
        return; 
      }
      
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifica in corso...';
        const iscritti = await window.DataLoader.loadIscritti();
        const cfUtente = Array.from(document.querySelectorAll('.cf-segment')).map(input => input.value).join('').toUpperCase();
        
        if (iscritti && iscritti.includes(cfUtente)) {
          window.Modal.show(
            "Iscrizione già presente",
            "Il tuo Codice Fiscale risulta già registrato per questo evento. Se credi si tratti di un errore, o se vuoi modificare i tuoi dati, contatta l'organizzazione all'indirizzo email: orientamento@unipi.it",
            { closeText: "Ho capito" }
          );
          submitBtn.textContent = "Procedi all'iscrizione";
          checkFormCompleteness();
        } else {
          redirectToMicrosoftForms();
        }
      } catch (error) {
        console.error("Errore durante la verifica degli iscritti:", error);
        window.Modal.show(
          "Errore di Sistema",
          "Non è stato possibile verificare la tua iscrizione. Assicurati che il file 'data/data_iscritti.json' esista e sia accessibile. Se il problema persiste, contatta l'organizzazione.",
          { closeText: "Chiudi" }
        );
        submitBtn.disabled = false;
        submitBtn.textContent = "Procedi all'iscrizione";
      }
    });

    const redirectToMicrosoftForms = () => {
      if (!window.CONFIG || !window.CONFIG.MS_FORMS_BASE_URL || !window.CONFIG.MS_FORMS_MAPPING) {
        alert("Errore: Configurazione per Microsoft Forms non trovata.");
        return;
      }
      const { MS_FORMS_BASE_URL, MS_FORMS_MAPPING } = window.CONFIG;
      let finalUrl = MS_FORMS_BASE_URL;
      for (const [formId, msFormsId] of Object.entries(MS_FORMS_MAPPING)) {
        let value = '';
        if (formId === 'codiceFiscale') {
          const cfValue = Array.from(document.querySelectorAll('.cf-segment')).map(input => input.value).join('');
          if (cfValue.length === 16) value = cfValue.toUpperCase();
        } else if (formId === 'luogoNascita') {
          const isEstero = document.getElementById('esteroSi').checked;
          const fieldId = isEstero ? 'paeseEstero' : 'comuneNascita';
          const field = document.getElementById(fieldId);
          if (field) value = field.value;
        } else {
          const field = document.getElementById(formId);
          if (field) value = field.value;
        }
        if (value) {
          finalUrl += `&${msFormsId}=${encodeURIComponent(value)}`;
        }
      }
      window.location.href = finalUrl;
    };
  });
})();
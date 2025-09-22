/**
 * form-submit-handler.js
 * Versione finale di produzione
 */
(function() {
  document.addEventListener('DOMContentLoaded', () => {

    const submitBtn = document.getElementById('submit-btn');
    if (!submitBtn) return;

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
      
      // ✅ NUOVO CONTROLLO: Verifica anche che l'email primaria abbia un formato valido
      const emailPrimariaField = document.getElementById('emailPrimaria');
      const isEmailValid = window.Validators.isValidEmail(emailPrimariaField.value);

      submitBtn.disabled = !(allFieldsFilled && luogoNascitaFilled && cfIsFilled && isEmailValid);
    };

    const fieldsToWatch = document.querySelectorAll('form input, form select');
    fieldsToWatch.forEach(field => {
      field.addEventListener('input', checkFormCompleteness);
      field.addEventListener('change', checkFormCompleteness);
    });

    submitBtn.addEventListener('click', () => {
      // ✅ NUOVO CONTROLLO: Verifica la presenza di errori prima di procedere
      const errorFields = document.querySelectorAll('.field--error');
      if (errorFields.length > 0) {
        window.Modal.show(
          "Attenzione",
          "Ci sono ancora dei campi con errori o non validi. Correggili prima di procedere.",
          { closeText: "OK, correggo" }
        );
        return; // Blocca il reindirizzamento
      }
      
      redirectToMicrosoftForms();
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
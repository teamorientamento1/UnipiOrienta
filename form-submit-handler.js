(function() {
  document.addEventListener('DOMContentLoaded', () => {

    const submitBtn = document.getElementById('submit-btn');
    if (!submitBtn) return;

    const requiredFieldIds = [
      'nome', 'cognome', 'dataNascita', 'genere', 'comuneResidenza', 'plessoScuola'
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
      
      submitBtn.disabled = !(allFieldsFilled && luogoNascitaFilled && cfIsFilled);
    };

    const fieldsToWatch = document.querySelectorAll('form input, form select');
    fieldsToWatch.forEach(field => {
      field.addEventListener('input', checkFormCompleteness);
      field.addEventListener('change', checkFormCompleteness);
    });

    submitBtn.addEventListener('click', () => {
      redirectToMicrosoftForms();
    });

    const redirectToMicrosoftForms = () => {
      if (!window.CONFIG || !window.CONFIG.MS_FORMS_BASE_URL || !window.CONFIG.MS_FORMS_MAPPING) {
        alert("Errore: Configurazione per Microsoft Forms non trovata. Contattare l'amministratore.");
        return;
      }
      
      const { MS_FORMS_BASE_URL, MS_FORMS_MAPPING } = window.CONFIG;

      const responses = {};
      for (const [formId, msFormsId] of Object.entries(MS_FORMS_MAPPING)) {
        if (formId === 'codiceFiscale') {
          const cfValue = Array.from(document.querySelectorAll('.cf-segment')).map(input => input.value).join('');
          if (cfValue.length === 16) {
            responses[msFormsId] = cfValue.toUpperCase();
          }
        } else {
          const field = document.getElementById(formId);
          if (field && field.value) {
            responses[msFormsId] = field.value;
          }
        }
      }

      const responsesJson = JSON.stringify(responses);
      
      // ✅ LOGICA MIGLIORATA: Aggiunge '&' se l'URL base ha già dei parametri, altrimenti '?'.
      const separator = MS_FORMS_BASE_URL.includes('?') ? '&' : '?';
      const finalUrl = `${MS_FORMS_BASE_URL}${separator}responses=${encodeURIComponent(responsesJson)}`;

      console.log("Reindirizzamento a:", finalUrl);
      window.location.href = finalUrl;
    };
  });
})();
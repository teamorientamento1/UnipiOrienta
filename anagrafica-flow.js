// Questo script gestisce la visualizzazione sequenziale dei campi dell'anagrafica.
(function () {
  document.addEventListener('DOMContentLoaded', () => {

    // Riferimenti agli elementi del DOM
    const nomeInput = document.getElementById('nome');
    const fieldCognome = document.getElementById('field-cognome');

    const dataNascitaInput = document.getElementById('dataNascita');
    const fieldGenere = document.getElementById('field-genere');

    /**
     * Mostra il campo Cognome non appena l'utente finisce di inserire il nome
     * e solo se ha scritto qualcosa.
     */
    if (nomeInput && fieldCognome) {
      nomeInput.addEventListener('blur', () => {
        // 'blur' si attiva quando l'utente clicca fuori dal campo
        if (nomeInput.value.trim() !== '') {
          fieldCognome.hidden = false;
        }
      });
    }

    /**
     * Mostra il campo Genere non appena l'utente seleziona una data di nascita.
     */
    if (dataNascitaInput && fieldGenere) {
      dataNascitaInput.addEventListener('change', () => {
        // 'change' si attiva quando il valore del campo data cambia
        if (dataNascitaInput.value) {
          fieldGenere.hidden = false;
        }
      });
    }

  });
})();
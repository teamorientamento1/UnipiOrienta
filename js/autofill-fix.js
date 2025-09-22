/**
 * autofill-fix.js
 * Impedisce al browser di forzare l'autocompletamento sui campi del form.
 * Imposta i campi come readonly al caricamento e rimuove l'attributo
 * al primo focus, ingannando il meccanismo di autofill.
 */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Seleziona tutti gli input di testo e data nella sezione anagrafica
    const inputs = document.querySelectorAll(
      '#section-anagrafica input.input, #section-anagrafica input[type="date"]'
    );

    if (inputs.length === 0) return;

    // Imposta tutti i campi come readonly per bloccare l'autofill iniziale
    inputs.forEach(input => {
      input.setAttribute('readonly', 'readonly');
      // Aggiungi un listener per rimuovere l'attributo al primo focus
      input.addEventListener('focus', function onFirstFocus() {
        this.removeAttribute('readonly');
        // Rimuovi questo stesso listener per non rieseguirlo inutilmente
        this.removeEventListener('focus', onFirstFocus);
      });
    });
  });
})();
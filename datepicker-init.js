/**
 * datepicker-init.js
 * Inizializza e configura Pikaday, il selettore di date personalizzato.
 */
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const datepickerField = document.getElementById('dataNascita');
    if (!datepickerField) return;

    // Configurazione di Pikaday
    const picker = new Pikaday({
      field: datepickerField,
      format: 'YYYY-MM-DD', // Formato standard per la compatibilità
      yearRange: [1900, new Date().getFullYear()], // Range di anni selezionabili
      maxDate: new Date(), // Non si possono selezionare date future
      
      // Traduzioni in italiano
      i18n: {
        previousMonth: 'Mese Precedente',
        nextMonth: 'Mese Successivo',
        months: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
        weekdays: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
        weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
      },
      
      // Funzione per assicurarsi che il campo 'change' venga attivato
      // e che gli altri script (come anagrafica-flow) reagiscano alla selezione.
      onSelect: function() {
        datepickerField.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
})();
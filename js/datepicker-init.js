/**
 * datepicker-init.js
 * Inizializza e configura flatpickr, il nuovo selettore di date.
 */
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const datepickerField = document.getElementById('dataNascita');
    if (!datepickerField) return;

    flatpickr.localize(flatpickr.l10ns.it);

    flatpickr(datepickerField, {
      dateFormat: "d - m - Y",
      maxDate: "today",
      onChange: function(selectedDates, dateStr, instance) {
        instance.element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
})();
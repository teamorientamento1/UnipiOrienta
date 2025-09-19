/**
 * events.js
 * Gestione tasti globali
 * - Blocca Enter per evitare invii/avanzamenti involontari
 */
(function(){
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // Consenti Enter solo in textarea (qui non le usiamo comunque)
      if (e.target && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    }
  });
})();

/* Bootstrap app */
(function(){
  // Versione (su GitHub Pages funziona)
  fetch("version.json").then(r => r.json()).then(data=>{
    const el = document.getElementById("app-version");
    if(el) el.textContent = `Versione ${data.version} (build ${data.build})`;
    console.info(`Maschera v${data.version} — build ${data.build} — ${data.date}`);
  }).catch(()=>{ /* ok in contesto file:// */ });

  // Inizializza dopo che il DOM è pronto (script caricati con defer)
  window.addEventListener("DOMContentLoaded", () => {
    if (window.FieldHandlers?.initAnagrafica) {
      window.FieldHandlers.initAnagrafica();
    }
  });
})();

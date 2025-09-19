/* Bootstrap minimale per Step 0 */
(function(){
  // Stampa versione se servita via HTTP/HTTPS (su GitHub Pages funziona)
  fetch("version.json").then(r => r.json()).then(data=>{
    const el = document.getElementById("app-version");
    if(el) el.textContent = `Versione ${data.version} (build ${data.build})`;
    console.info(`Maschera v${data.version} — build ${data.build} — ${data.date}`);
  }).catch(()=>{ /* ok in contesto file:// */ });
})();

const FieldHandlers = (() => {
  const { qs, show, hide, setError, clearError } = window.Dom;
  const { isLikelyName, toTitleCase, isValidDateStr, isValidEmail } = window.Validators;

  let elNome, fldNome, elCognome, fldCognome, elData, fldData, elGenere, fldGenere, grpDG, grpEstero, elEmailP, fldEmailP, elEmailS, fldEmailS;

  function cacheElements(){
    fldNome = qs("#field-nome"); elNome = qs("#nome");
    fldCognome = qs("#field-cognome"); elCognome = qs("#cognome");
    fldData = qs("#field-datanascita"); elData = qs("#dataNascita");
    fldGenere = qs("#field-genere"); elGenere = qs("#genere");
    grpDG = qs("#group-datagenere");
    grpEstero = qs("#group-estero");
    // ✅ NUOVI CAMPI EMAIL
    fldEmailP = qs("#field-email-primaria"); elEmailP = qs("#emailPrimaria");
    fldEmailS = qs("#field-email-secondaria"); elEmailS = qs("#emailSecondaria");
  }
  
  function calculateAge(dateString) {
    const formats = ['d - m - Y', 'DD - MM - YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];
    const birthDate = moment(dateString, formats, true);
    if (!birthDate.isValid()) return 0;
    return moment().diff(birthDate, 'years');
  }

  function onNomeBlur(){ if (elNome.value) elNome.value = toTitleCase(elNome.value); }
  function onCognomeBlur(){ if (elCognome.value) elCognome.value = toTitleCase(elCognome.value); }

  function onNomeCognomeInput(){ clearError(fldNome); clearError(fldCognome); const okNome = isLikelyName(elNome.value); const okCognome = isLikelyName(elCognome.value); if (okNome && okCognome) { show(grpDG); } else { hide(grpDG); hide(grpEstero); } }
  function onDataNascitaChange(){ clearError(fldData); const dateValue = elData.value; hide(grpEstero); if (!dateValue || !isValidDateStr(dateValue)) { if (dateValue) setError(fldData, "Data non valida."); revealEsteroIfReady(); return; } const age = calculateAge(dateValue); const MIN_AGE = 13; const MAX_AGE = 20; if (age < MIN_AGE) { setError(fldData, `L'evento è riservato a partecipanti con almeno ${MIN_AGE} anni.`); window.Modal.show( "Età non Valida", `L'evento è riservato a partecipanti con almeno ${MIN_AGE} anni. Non è possibile procedere.`, { closeText: "Chiudi" } ); revealEsteroIfReady(); return; } if (age > MAX_AGE) { window.Modal.show( "Verifica Età", "Attenzione, l'evento è principalmente rivolto a studenti delle scuole superiori. Confermi di voler procedere?", { closeText: "OK, procedo" } ); } revealEsteroIfReady(); }
  function onGenereChange(){ clearError(fldGenere); revealEsteroIfReady(); }
  function revealEsteroIfReady(){ const isAgeValid = elData.value && isValidDateStr(elData.value) && calculateAge(elData.value) >= 13; const isGenereSelected = !!elGenere.value; if (isAgeValid && isGenereSelected) { show(grpEstero); } else { hide(grpEstero); } }
  
  // ✅ NUOVA FUNZIONE: Valida l'email quando l'utente clicca fuori dal campo
  function onEmailBlur(e) {
    const el = e.target;
    const field = el.closest('.field');
    clearError(field); // Pulisce errori precedenti
    if (el.value && !isValidEmail(el.value)) {
      setError(field, "Formato email non valido. Controlla che sia corretta per ricevere l'attestato.");
    }
  }

  function wireEvents(){
    elNome.addEventListener("input", onNomeCognomeInput);
    elCognome.addEventListener("input", onNomeCognomeInput);
    elNome.addEventListener("blur", onNomeBlur);
    elCognome.addEventListener("blur", onCognomeBlur);
    elData.addEventListener("change", onDataNascitaChange);
    elData.addEventListener("input", onDataNascitaChange);
    elGenere.addEventListener("change", onGenereChange);
    // ✅ NUOVI LISTENER per i campi email
    elEmailP.addEventListener("blur", onEmailBlur);
    elEmailS.addEventListener("blur", onEmailBlur);
  }

  function initAnagrafica(){
    cacheElements();
    wireEvents();
  }

  return { initAnagrafica };
})();
window.FieldHandlers = FieldHandlers;
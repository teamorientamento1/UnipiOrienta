const FieldHandlers = (() => {
  const { qs, show, hide, setError, clearError } = window.Dom;
  const { isLikelyName, toTitleCase, isValidDateStr } = window.Validators;

  let elNome, fldNome, elCognome, fldCognome, elData, fldData, elGenere, fldGenere, grpDG, grpEstero;

  function cacheElements(){
    fldNome = qs("#field-nome"); elNome = qs("#nome");
    fldCognome = qs("#field-cognome"); elCognome = qs("#cognome");
    fldData = qs("#field-datanascita"); elData = qs("#dataNascita");
    fldGenere = qs("#field-genere"); elGenere = qs("#genere");
    grpDG = qs("#group-datagenere");
    grpEstero = qs("#group-estero");
  }
  
  function calculateAge(dateString) {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function onNomeBlur(){
    if (elNome.value) elNome.value = toTitleCase(elNome.value);
  }
  function onCognomeBlur(){
    if (elCognome.value) elCognome.value = toTitleCase(elCognome.value);
  }

  function onNomeCognomeInput(){
    clearError(fldNome); clearError(fldCognome);
    const okNome = isLikelyName(elNome.value);
    const okCognome = isLikelyName(elCognome.value);
    if (okNome && okCognome) {
      show(grpDG);
    } else {
      hide(grpDG); hide(grpEstero);
    }
  }

  function onDataNascitaChange(){
    clearError(fldData);
    const dateValue = elData.value;
    hide(grpEstero);

    if (!dateValue || !isValidDateStr(dateValue)) {
      if (dateValue) setError(fldData, "Data non valida.");
      revealEsteroIfReady();
      return;
    }
    
    const age = calculateAge(dateValue);
    const MIN_AGE = 13;
    const MAX_AGE = 20;

    if (age < MIN_AGE) {
      setError(fldData, `L'evento è riservato a partecipanti con almeno ${MIN_AGE} anni.`);
      window.Modal.show(
        "Età non Valida",
        `L'evento è riservato a partecipanti con almeno ${MIN_AGE} anni. Non è possibile procedere.`,
        { closeText: "Chiudi" }
      );
      revealEsteroIfReady();
      return;
    }
    
    if (age > MAX_AGE) {
      window.Modal.show(
        "Verifica Età",
        "Attenzione, l'evento è principalmente rivolto a studenti delle scuole superiori. Confermi di voler procedere?",
        { closeText: "OK, procedo" }
      );
    }

    revealEsteroIfReady();
  }

  function onGenereChange(){
    clearError(fldGenere);
    revealEsteroIfReady();
  }

  function revealEsteroIfReady(){
    const isAgeValid = elData.value && isValidDateStr(elData.value) && calculateAge(elData.value) >= 13;
    const isGenereSelected = !!elGenere.value;
    
    if (isAgeValid && isGenereSelected) {
      show(grpEstero);
    } else {
      hide(grpEstero);
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
  }

  function initAnagrafica(){
    cacheElements();
    wireEvents();
  }

  return { initAnagrafica };
})();
window.FieldHandlers = FieldHandlers;
/**
 * FieldHandlers.js
 * Reveal progressivo Step 2 — ANAGRAFICA
 */

const FieldHandlers = (() => {
  const { qs, show, hide, setError, clearError } = window.Dom;
  const { normalizeCF, isValidCFBasic, isLikelyName, toTitleCase, isValidDateStr } = window.Validators;

  // Riferimenti
  let elCF, fldCF, hintCF;
  let elNome, fldNome, hintNome;
  let elCognome, fldCognome, hintCognome;
  let grpNC;
  let elData, fldData, hintData;
  let elGenere, fldGenere, hintGenere;
  let grpDG;
  let elEsteroSi, elEsteroNo, fldEstero, grpEstero;

  function cacheElements(){
    fldCF   = qs("#field-cf");   elCF   = qs("#cf");   hintCF = qs("#hint-cf");
    fldNome = qs("#field-nome"); elNome = qs("#nome"); hintNome = qs("#hint-nome");
    fldCognome = qs("#field-cognome"); elCognome = qs("#cognome"); hintCognome = qs("#hint-cognome");
    grpNC   = qs("#group-nomecognome");

    fldData = qs("#field-datanascita"); elData = qs("#dataNascita"); hintData = qs("#hint-datanascita");
    fldGenere = qs("#field-genere"); elGenere = qs("#genere"); hintGenere = qs("#hint-genere");
    grpDG   = qs("#group-datagenere");

    fldEstero = qs("#field-estero"); grpEstero = qs("#group-estero");
    elEsteroSi = qs("#esteroSi"); elEsteroNo = qs("#esteroNo");
  }

  // --- VALIDAZIONI E REVEAL ---

  function onCFInput(){
    const v = normalizeCF(elCF.value);
    elCF.value = v; // normalizza maiuscole/spazi

    clearError(fldCF);
    if (v.length === 0) {
      // reset a monte
      hide(grpNC); hide(grpDG); hide(grpEstero);
      return;
    }
    if (!isValidCFBasic(v)) {
      setError(fldCF, "Inserisci un codice fiscale nel formato corretto (16 caratteri).");
      hide(grpNC); hide(grpDG); hide(grpEstero);
      return;
    }
    // valido → mostra Nome/Cognome
    show(grpNC);
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

    if (!okNome && elNome.value.trim().length>0) setError(fldNome, "Nome non valido.");
    if (!okCognome && elCognome.value.trim().length>0) setError(fldCognome, "Cognome non valido.");

    if (okNome && okCognome) {
      show(grpDG);
    } else {
      hide(grpDG); hide(grpEstero);
    }
  }

  function onDataChange(){
    clearError(fldData);
    const v = elData.value;
    if (v && !isValidDateStr(v)) {
      setError(fldData, "Data non valida.");
    }
    revealEsteroIfReady();
  }

  function onGenereChange(){
    clearError(fldGenere);
    const v = elGenere.value;
    if (!v) {
      setError(fldGenere, "Seleziona il genere.");
    }
    revealEsteroIfReady();
  }

  function revealEsteroIfReady(){
    const okData = elData.value && isValidDateStr(elData.value);
    const okGenere = !!elGenere.value;
    if (okData && okGenere) {
      show(grpEstero);
    } else {
      hide(grpEstero);
    }
  }

  function wireEvents(){
    // CF
    elCF.addEventListener("input", onCFInput);

    // Nome/Cognome
    elNome.addEventListener("input", onNomeCognomeInput);
    elCognome.addEventListener("input", onNomeCognomeInput);
    elNome.addEventListener("blur", onNomeBlur);
    elCognome.addEventListener("blur", onCognomeBlur);

    // Data/Genere
    elData.addEventListener("change", onDataChange);
    elData.addEventListener("input", onDataChange);
    elGenere.addEventListener("change", onGenereChange);

    // Estero (per ora nessun reveal successivo in Step 2)
    if (elEsteroSi) elEsteroSi.addEventListener("change", ()=>{ /* placeholder */ });
    if (elEsteroNo) elEsteroNo.addEventListener("change", ()=>{ /* placeholder */ });
  }

  function initAnagrafica(){
    cacheElements();
    wireEvents();
  }

  return { initAnagrafica };
})();

window.FieldHandlers = FieldHandlers;

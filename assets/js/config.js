window.MASKERA_CONFIG = {
  AGE_WARNING_MIN: 13,
  AGE_WARNING_MAX: 25,
  EMAIL_REQUIRED: true,

  // TELEFONO: E.164 -> 9..15 cifre (ammessi + e trattini; NO spazi)
  TEL_MIN_DIGITS: 9,
  TEL_MAX_DIGITS: 15,

  UI: { errorClass: "error", hiddenClass: "hidden" },
  COPY: {
    required: "Questo campo è obbligatorio.",
    invalidFormat: "Il formato non è valido.",
    noSpaces: "Niente spazi in questo campo.",
    telInvalid: "Numero non valido. 9–15 cifre (ammessi + e trattini, senza spazi).",
    emailInvalid: "Indirizzo email non valido.",
    genereRequired: "Seleziona un'opzione.",
    sessoNascRequired: "Seleziona il sesso di nascita.",
    esteroRequired: "Seleziona se sei nato all'estero.",
    dsaRequired: "Seleziona un'opzione.",
    dobInvalid: "Inserisci una data valida.",
    dobFuture: "La data non può essere nel futuro.",
    ageWarnYoung: "Età molto bassa per questo form.",
    ageWarnOld: "Età più alta del previsto (spesso i docenti si iscrivono qui per errore).",
  },

  // Forzo il JSON delle scuole da GitHub Pages (assoluto).
  // Se in futuro cambi repo o percorso, aggiorna solo questa riga.
  SCHOOLS_URL: "https://teamorientamento1.github.io/MASCHERA-CODICE-FISCALE/data/scuole_min.json",

  // Percorsi extra per i dataset (opzionale). Lascio null: usa i default interni.
  DATA_BASES: null
};

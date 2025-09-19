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

  // (opzionale) URL assoluto del JSON scuole. Se valorizzato, bypassa la ricerca nei percorsi locali.
  // Esempio GitHub Pages:
  // SCHOOLS_URL: "https://<utente>.github.io/<repo>/data/scuole_min.json",
  SCHOOLS_URL: null,

  // (opzionale) Percorsi aggiuntivi, relativi alla pagina, in cui cercare i dataset.
  // Esempio: ["assets/data/","data/"] — se null usa i percorsi di default.
  DATA_BASES: null
};

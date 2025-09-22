/**
 * Config globale
 */
window.CONFIG = {
  DEV: false,
  COLORS: {
    PRIMARY: "#04477B",
    ERROR: "#b91c1c"
  },

  // Inserisci qui il link base del tuo modulo.
  MS_FORMS_BASE_URL: "https://forms.office.com/Pages/ResponsePage.aspx?id=MWtFxyCi9Ue-Ukc4KGcKoRBcQtrLxDxHtGeSc5uVjjlUNDFMUTAxWEQzS1RURThRSU4zQTlCWDA2Sy4u",

  // ✅ MAPPATURA CORRETTA: Usa solo gli ID corti che iniziano per "r".
  MS_FORMS_MAPPING: {
    'codiceFiscale':      'r5842976b5e5a4f6b9e3435c178b1c765',
    'nome':                'r48d682a7b0d744cfbabb7572081d78b5',
    
    // Sostituisci questo con l'ID corto del cognome quando lo avrai
    'cognome':             'r_ID_DEL_COGNOME', 

    // Aggiungi qui gli altri ID corti...
    'dataNascita':         'r_ID_DATA_NASCITA',
    'genere':              'r_ID_GENERE',
    'luogoNascita':        'r_ID_LUOGO_NASCITA',
    'provinciaResidenza':  'r_ID_PROVINCIA_RESIDENZA',
    'comuneResidenza':     'r_ID_COMUNE_RESIDENZA',
    'regioneScuola':       'r_ID_REGIONE_SCUOLA',
    'provinciaScuola':     'r_ID_PROVINCIA_SCUOLA',
    'comuneScuola':        'r_ID_COMUNE_SCUOLA',
    'istitutoScuola':      'r_ID_ISTITUTO_SCUOLA',
    'plessoScuola':        'r_ID_PLESSO_SCUOLA',
    'emailPrimaria':       'r_ID_EMAIL_PRIMARIA',
    'emailSecondaria':     'r_ID_EMAIL_SECONDARIA'
  }
};
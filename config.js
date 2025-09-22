/**
 * Config globale
 */
window.CONFIG = {
  DEV: false,
  COLORS: {
    PRIMARY: "#04477B",
    ERROR: "#b91c1c"
  },

  // ✅ CONFIGURAZIONE MICROSOFT FORMS
  
  // 1. URL base del tuo modulo.
  MS_FORMS_BASE_URL: "https://forms.office.com/Pages/ResponsePage.aspx?id=MWtFxyCi9Ue-Ukc4KGcKoRBcQtrLxDxHtGeSc5uVjjlUNDFMUTAxWEQzS1RURThRSU4zQTlCWDA2Sy4u",

  // 2. Mappatura dei campi:
  //    'id_del_nostro_sito' : 'id_domanda_di_microsoft_forms'
  MS_FORMS_MAPPING: {
    // ✅ CORRETTO: Ho corretto il mio errore di battitura nell'ID qui sotto.
    'codiceFiscale': 'QuestionId_r5842976b5e5a4f6b9e3435c178b1c765',
    'nome': 'QuestionId_r48d682a7b0d744cfbabb7572081d78b5',
    'cognome': 'QuestionId_r2d6b72bc32594275a160381b5f7b4d79'
  }
};
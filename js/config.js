/**
 * Config globale
 */
window.CONFIG = {
  DEV: false,
  COLORS: {
    PRIMARY: "#04477B",
    ERROR: "#b91c1c"
  },

  // LINK BASE DEL MODULO MICROSOFT FORMS
  // Deve fermarsi a "...aspx?id=XXXX": i parametri di precompilazione
  // vengono aggiunti da form-submit-handler.js usando MS_FORMS_MAPPING.
  MS_FORMS_BASE_URL: "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=MWtFxyCi9Ue-Ukc4KGcKoRBcQtrLxDxHtGeSc5uVjjlUQlpJWU8wRUw4NkxFUTlZN0Y5TFVURkJQTi4u",

  // MAPPATURA CAMPI -> ID DOMANDE DEL FORM
  MS_FORMS_MAPPING: {
    'codiceFiscale':      'r4a399b8065d54b8ebcd2a6c2ca505819',
    'nome':                'r517ff370efa34569a7c73da430bddbf7',
    'cognome':             'reb8778efedb74bf0816c139df1d98879',
    'dataNascita':         'r2e35d030f4c04c0dba8a6b518957f51a',
    'genere':              'rb7f9a1737482497588ffaed17ce09f65',
    'luogoNascita':        'rb527c860b1ac40e49cb1f47ff445f7a1',
    'provinciaNascita':    'r5e1291dc99fd48c89ed84e62211e710e',
    'comuneResidenza':     'ra7cfa7978bca4554a1f968398e95f0bd',
    'provinciaScuola':     'r48622c07d3e24a479c1dadcfd1c0f79c',
    'comuneScuola':        'r0030b7acf1094874b304fc31e8b763ba',
    'istitutoScuola':      'r9078f18f64344fcba71563775e1112df',
    'plessoScuola':        'ra627e1563e8a4682a789cf293aa15730',
    'emailPrimaria':       'rb69279519d15488c9f03ac66bad36037',
    'emailSecondaria':     'r4598613eaacd4f00aefeafcf07e0ed00' // ✅ Aggiunto
  }
};
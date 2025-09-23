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
  MS_FORMS_BASE_URL: "https://forms.office.com/Pages/ResponsePage.aspx?id=MWtFxyCi9Ue-Ukc4KGcKoRBcQtrLxDxHtGeSc5uVjjlUQkhUWUpJSjk3WlpKMTFWT0VGNTRHN0RUUi4u&rb69279519d15488c9f03ac66bad36037=EMAIL_PRIMARIA&r4598613eaacd4f00aefeafcf07e0ed00=EMAIL_SECONDARIA&r517ff370efa34569a7c73da430bddbf7=NOME&reb8778efedb74bf0816c139df1d98879=COGNOME&rb7f9a1737482497588ffaed17ce09f65=GENERE&r2e35d030f4c04c0dba8a6b518957f51a=DATA_NASCITA&r5e1291dc99fd48c89ed84e62211e710e=PROVINCIA_NASCITA&rb527c860b1ac40e49cb1f47ff445f7a1=LUOGO_NASCITA&r4a399b8065d54b8ebcd2a6c2ca505819=CODICE_FISCALE&ra7cfa7978bca4554a1f968398e95f0bd=COMUNE_RESIDENZA&r9078f18f64344fcba71563775e1112df=ISTITUTO_SCUOLA&ra627e1563e8a4682a789cf293aa15730=PLESSO_SCUOLA",

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
    'istitutoScuola':      'r9078f18f64344fcba71563775e1112df',
    'plessoScuola':        'ra627e1563e8a4682a789cf293aa15730',
    'emailPrimaria':       'rb69279519d15488c9f03ac66bad36037',
    'emailSecondaria':     'r4598613eaacd4f00aefeafcf07e0ed00' // ✅ Aggiunto
  }
};
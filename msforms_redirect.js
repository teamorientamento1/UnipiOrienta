/* ========================================================================
   MS Forms Prefilled Redirect — Drop-in helper
   Versione: 1.0.0
   Autore: ChatGPT (per Gianluca)
   Scopo: costruire il link precompilato a Microsoft Forms e fare redirect
   ======================================================================== */

(function () {
  "use strict";

  // ============ UTILS ============
  function qs(selector, root = document) {
    return root.querySelector(selector);
  }
  function safeStr(v) {
    return (v ?? "").toString().trim();
  }
  function encode(v) {
    return encodeURIComponent(safeStr(v));
  }

  // Normalizza date comuni -> YYYY-MM-DD
  function normalizeDateToISO(dateStr) {
    const s = safeStr(dateStr);
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // già ISO

    // DD/MM/YYYY o DD-MM-YYYY
    const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m1) {
      const [, dd, mm, yyyy] = m1;
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    // YYYY/MM/DD o YYYY-MM-DD-like
    const m2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m2) {
      const [, yyyy, mm, dd] = m2;
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return s; // fallback
  }

  // Ricomponi CF da un input unico o da segmenti multipli
  function buildCF({ cfSelector, cfPartsSelectors }) {
    if (cfSelector) {
      return safeStr(qs(cfSelector)?.value).toUpperCase();
    }
    if (Array.isArray(cfPartsSelectors) && cfPartsSelectors.length) {
      const parts = cfPartsSelectors.map((sel) => safeStr(qs(sel)?.value));
      return parts.join("").toUpperCase();
    }
    return "";
  }

  // Mappa sesso (es. "M" -> "Maschio") se necessario
  function mapSesso(value, mapping) {
    const v = safeStr(value);
    if (!mapping) return v;
    const key = v.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
    for (const [from, to] of Object.entries(mapping)) {
      const k = safeStr(from)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toUpperCase();
      if (k === key) return to;
    }
    return v;
  }

  // Sostituisce tutti i token con valori URL-encoded
  function buildPrefilledUrl(prefilledUrl, replacements) {
    let url = prefilledUrl;
    Object.entries(replacements).forEach(([token, rawVal]) => {
      url = url.split(token).join(encode(rawVal)); // replaceAll compat
    });
    return url;
  }

  // Validazione semplice (configurabile)
  function validate(values, requiredKeys, labelsMap) {
    const missing = [];
    for (const key of requiredKeys) {
      if (!safeStr(values[key])) missing.push(labelsMap[key] || key);
    }
    return missing;
  }

  // ============ MOTORE ============
  function makeRedirectUrl(config) {
    const {
      prefilledUrl,
      selectors,
      sessoMapping,
      requiredKeys = [], // es.: ["nome","cognome","codiceFiscale",...]
      labelsMap = {},    // per messaggi utente
    } = config;

    // Leggi valori dal DOM
    const nome = safeStr(qs(selectors.nome)?.value);
    const cognome = safeStr(qs(selectors.cognome)?.value);

    const sessoRaw = selectors.sessoRadio
      ? safeStr(document.querySelector(selectors.sessoRadio)?.value)
      : safeStr(qs(selectors.sesso)?.value);
    const sesso = mapSesso(sessoRaw, sessoMapping);

    const dataNascita = normalizeDateToISO(qs(selectors.dataNascita)?.value);
    const provinciaNascita = safeStr(qs(selectors.provinciaNascita)?.value);
    const cittaNascita = safeStr(qs(selectors.cittaNascita)?.value);
    const cittaResidenza = safeStr(qs(selectors.cittaResidenza)?.value);
    const istPrincNome = safeStr(qs(selectors.istPrincNome)?.value);
    const plessoNome = safeStr(qs(selectors.plessoNome)?.value);

    const codiceFiscale = buildCF({
      cfSelector: selectors.cf,
      cfPartsSelectors: selectors.cfParts,
    });

    const values = {
      nome,
      cognome,
      codiceFiscale,
      sesso,
      dataNascita,
      provinciaNascita,
      cittaNascita,
      cittaResidenza,
      istPrincNome,
      plessoNome,
    };

    // Validazione (se configurata)
    const missing = validate(values, requiredKeys, labelsMap);
    if (missing.length) {
      alert(
        "Per proseguire, completa questi campi:\n- " + missing.join("\n- ")
      );
      return null;
    }

    // TOKEN -> VALORE (coerenti con il tuo prefilled link)
    const replacements = {
      "__NOME__": nome,
      "__COGNOME__": cognome,
      "__CODICEFISCALE__": codiceFiscale,
      "__SESSO__": sesso,
      "__DATA_NASCITA__": dataNascita,
      "__PROVINCIA_NASCITA__": provinciaNascita,
      "__CITTA_NASCITA__": cittaNascita,
      "__CITTA_RESIDENZA__": cittaResidenza,
      "__IST_PRINC_NOME__": istPrincNome,
      "__PLESSO_NOME__": plessoNome,
    };

    return buildPrefilledUrl(prefilledUrl, replacements);
  }

  function attachRedirect(config) {
    const {
      triggerSelector,
      triggerEvent = "click",
      preventDefault = true,
      openInNewTab = false, // cambia a true se vuoi nuova scheda
      blockEnterSubmit = true,
      formSelector, // opzionale: per bloccare submit del form
    } = config;

    // Blocca invio accidentale con Enter
    if (blockEnterSubmit) {
      document.addEventListener("keydown", function (e) {
        const isEnter = e.key === "Enter" || e.keyCode === 13;
        const isTextInput = /^(INPUT|TEXTAREA|SELECT)$/.test(
          e.target?.tagName || ""
        );
        if (isEnter && isTextInput) {
          e.preventDefault();
        }
      });
    }

    // Se abbiamo un form e vogliamo evitare submit nativo
    if (formSelector) {
      const form = qs(formSelector);
      if (form) {
        form.addEventListener("submit", function (e) {
          if (preventDefault) e.preventDefault();
        });
      }
    }

    const trigger = qs(triggerSelector);
    if (!trigger) {
      console.warn("[MSFormsRedirect] Trigger non trovato:", triggerSelector);
      return;
    }

    trigger.addEventListener(triggerEvent, function (e) {
      if (preventDefault && e && typeof e.preventDefault === "function") {
        e.preventDefault();
      }

      const url = makeRedirectUrl(config);
      if (!url) return; // validazione bloccante

      if (openInNewTab) {
        window.open(url, "_blank", "noopener");
      } else {
        window.location.href = url; // stessa scheda (niente popup blocker)
      }
    });
  }

  // Esponi API
  window.MSFormsRedirect = {
    buildUrl: makeRedirectUrl,
    attach: attachRedirect,
  };

  // ===================== CONFIGURAZIONE (EDITA QUI) =====================
  const CONFIG = {
    // Il tuo link prefilled con i TOKEN
    prefilledUrl:
      "https://forms.office.com/Pages/ResponsePage.aspx?id=MWtFxyCi9Ue-Ukc4KGcKoRBcQtrLxDxHtGeSc5uVjjlUNDFMUTAxWEQzS1RURThRSU4zQTlCWDA2Sy4u&r5842976b5e5a4f6b9e3435c178b1c765=__CODICEFISCALE__&r48d682a7b0d744cfbabb7572081d78b5=__NOME__&r2d6b72bc32594275a160381b5f7b4d79=__COGNOME__&r453643fb35c3462fb3d93328660e3848=__SESSO__&r19568e35324442aa9fb7cc18e22c121e=__DATA_NASCITA__&r4fd5fc09897147dcaad7ec0bc80441c6=__PROVINCIA_NASCITA__&rf7ae5bfcb3524e2eb9f859453bf9a595=__CITTA_NASCITA__&r0e253625761a45bf934834ed222704b8=__CITTA_RESIDENZA__&r9bc9569e68e6450d8ba9871088265c67=__IST_PRINC_NOME__&r9c23fc61656240968ed2f97a86138a72=__PLESSO_NOME__",

    // === Selettori dei tuoi campi (aggiorna se diverso) ===
    selectors: {
      nome: "#nome",
      cognome: "#cognome",

      // Se è radio usa 'sessoRadio' con il :checked. Altrimenti 'sesso' (select/testo).
      // sessoRadio: 'input[name="sesso"]:checked',
      sesso: "#sesso",

      dataNascita: "#data_nascita",
      provinciaNascita: "#provincia_nascita",
      cittaNascita: "#citta_nascita",
      cittaResidenza: "#citta_residenza",
      istPrincNome: "#ist_princ_nome",
      plessoNome: "#plesso_nome",

      // CF a caselle (manteniamo la tua suddivisione 3+4+…).
      // Aggiungi/rimuovi selettori per rispecchiare il tuo layout.
      cfParts: ["#cf_1", "#cf_2", "#cf_3", "#cf_4"],

      // In alternativa, se hai un solo input CF:
      // cf: "#codice_fiscale",
    },

    // Mappatura valori sesso (adegua ai testi del Forms)
    sessoMapping: {
      M: "Maschio",
      F: "Femmina",
      X: "Non specificato",
      "Non specificato": "Non specificato",
      Maschio: "Maschio",
      Femmina: "Femmina",
    },

    // Campi richiesti prima del redirect (opzionale ma consigliato)
    requiredKeys: [
      "nome",
      "cognome",
      "codiceFiscale",
      "sesso",
      "dataNascita",
      "provinciaNascita",
      "cittaNascita",
      "cittaResidenza",
      "istPrincNome",
      "plessoNome",
    ],
    labelsMap: {
      nome: "Nome",
      cognome: "Cognome",
      codiceFiscale: "Codice fiscale",
      sesso: "Sesso",
      dataNascita: "Data di nascita",
      provinciaNascita: "Provincia di nascita",
      cittaNascita: "Città di nascita",
      cittaResidenza: "Città di residenza",
      istPrincNome: "Istituto principale",
      plessoNome: "Plesso",
    },

    // Aggancia al tuo bottone finale (stessa scheda consigliata)
    triggerSelector: "#btn_conferma",
    triggerEvent: "click",
    preventDefault: true,
    openInNewTab: false,

    // Evita invio accidentale con Enter
    blockEnterSubmit: true,

    // Se hai un <form>, puoi opzionalmente indicarlo per bloccare il submit nativo
    // formSelector: "#mio_form",
  };

  // Auto-attach al DOM ready
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }
  onReady(function () {
    if (qs(CONFIG.triggerSelector)) {
      attachRedirect(CONFIG);
    } else {
      console.warn(
        "[MSFormsRedirect] Nessun trigger trovato (",
        CONFIG.triggerSelector,
        ")."
      );
    }
  });
  // =================== /CONFIGURAZIONE ===================
})();

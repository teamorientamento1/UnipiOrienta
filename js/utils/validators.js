/**
 * validators.js
 * Validazioni base per Step 2
 */

const Validators = (() => {
  const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\- ]+$/u;
  const REPEAT_SEQ = /(.)\1{3,}/u; // 4+ caratteri uguali di fila (es. jjjj)

  function normalizeCF(v) {
    return (v || "").toUpperCase().replace(/\s+/g, "");
  }

  // Pattern base CF (senza controllo omocodia/char finale)
  // 6 lettere + 2 cifre + mese lettera + 2 cifre + lettera + 3 cifre + lettera
  const CF_PATTERN = /^[A-Z]{6}[0-9]{2}[ABCDEHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;

  function isValidCFBasic(raw) {
    const cf = normalizeCF(raw);
    if (cf.length !== 16) return false;
    return CF_PATTERN.test(cf);
  }

  function isLikelyName(v) {
    const s = (v || "").trim();
    if (s.length < 2) return false;
    if (!NAME_REGEX.test(s)) return false;
    if (REPEAT_SEQ.test(s)) return false;
    return true;
  }

  function toTitleCase(v) {
    // Capitalizza ogni "parola" separata da spazio, apostrofo o trattino
    return (v || "").toLowerCase().replace(/(^|[\s'’-])([a-zà-öø-ÿ])/giu, (m, p1, p2) => p1 + p2.toUpperCase());
  }

  /**
   * ✅ FUNZIONE CORRETTA
   * Valida una stringa di data usando Moment.js per gestire in modo affidabile
   * sia il formato 'AAAA-MM-GG' che 'GG-MM-AAAA'.
   */
  function isValidDateStr(dateStr) {
    if (!dateStr) return false;

    // Definiamo i formati di data che vogliamo accettare.
    const formats = ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY'];

    // Usiamo moment.js per analizzare la data. Il 'true' finale attiva la modalità "rigorosa",
    // che garantisce che la data corrisponda esattamente a uno dei formati.
    const m = moment(dateStr, formats, true);

    // Se la data non è valida secondo nessuno dei formati, la funzione si ferma.
    if (!m.isValid()) return false;

    // Eseguiamo controlli aggiuntivi per assicurarsi che la data sia ragionevole.
    const minYear = 1900;
    const today = moment(); // Data di oggi

    if (m.year() < minYear || m.isAfter(today)) {
      return false; // La data è troppo nel passato o è nel futuro
    }

    return true; // La data è valida!
  }

  return {
    normalizeCF,
    isValidCFBasic,
    isLikelyName,
    toTitleCase,
    isValidDateStr
  };
})();

window.Validators = Validators;
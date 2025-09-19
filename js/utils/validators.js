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

  function isValidDateStr(yyyy_mm_dd) {
    if (!yyyy_mm_dd) return false;
    const d = new Date(yyyy_mm_dd);
    if (Number.isNaN(d.getTime())) return false;
    const min = new Date("1900-01-01");
    const today = new Date();
    if (d < min || d > today) return false;
    return true;
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

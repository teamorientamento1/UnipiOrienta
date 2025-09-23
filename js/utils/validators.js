/**
 * validators.js
 * Validazioni base
 */
const Validators = (() => {
  const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\- ]+$/u;
  const REPEAT_SEQ = /(.)\1{3,}/u;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function normalizeCF(v) { return (v || "").toUpperCase().replace(/\s+/g, ""); }
  const CF_PATTERN = /^[A-Z]{6}[0-9]{2}[ABCDEHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;

  function isValidCFBasic(raw) { const cf = normalizeCF(raw); if (cf.length !== 16) return false; return CF_PATTERN.test(cf); }
  function isLikelyName(v) { const s = (v || "").trim(); if (s.length < 2) return false; if (!NAME_REGEX.test(s)) return false; if (REPEAT_SEQ.test(s)) return false; return true; }
  function toTitleCase(v) { return (v || "").toLowerCase().replace(/(^|[\s'’-])([a-zà-öø-ÿ])/giu, (m, p1, p2) => p1 + p2.toUpperCase()); }

  function isValidDateStr(dateStr) {
    if (!dateStr) return false;
    // ✅ CORREZIONE: Usa il formato corretto per moment.js (DD - MM - YYYY)
    const formats = ['DD - MM - YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];
    const m = moment(dateStr, formats, true);
    if (!m.isValid()) return false;
    const minYear = 1900;
    const today = moment();
    if (m.year() < minYear || m.isAfter(today)) { return false; }
    return true;
  }

  function isValidEmail(email) {
    if (!email || email.trim() === '') return true;
    return EMAIL_REGEX.test(email);
  }

  return {
    normalizeCF, isValidCFBasic, isLikelyName, toTitleCase, isValidDateStr, isValidEmail
  };
})();
window.Validators = Validators;
/* advanced-validator.js
   - Controllo coerenza Codice Fiscale ↔ Anagrafica (con omocodia e override)
   - Controllo coerenza Provincia di Residenza ↔ Provincia della Scuola (con override)
   - Trigger immediati: blur sull'ultimo segmento CF, change su anagrafica e luogo
   - Risoluzione "intelligente" del codice Belfiore se il select del comune di nascita fornisce solo la label
   - NEW: compatibilità output calcolatore (stringa o oggetto: .code | .cf | .codiceFiscale)
*/
(function () {
  'use strict';

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const log = (...args) => console.log('[AdvancedValidator]', ...args);

  function debounce(fn, wait = 300) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function norm(s) {
    return String(s || '')
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  function extractSiglaFromLabel(label) {
    const m = /\(([A-Z]{2})\)\s*$/.exec(String(label || ''));
    return m ? m[1] : '';
  }

  function generateOmocodiaVariants(cf) {
    const map = { '0':'L','1':'M','2':'N','3':'P','4':'Q','5':'R','6':'S','7':'T','8':'U','9':'V' };
    const positions = [6,7,9,10,12,13,14];
    const up = String(cf || '').toUpperCase();
    if (up.length !== 16) return [];
    const results = new Set();
    const anyNumeric = positions.some(i => /\d/.test(up[i]));
    if (!anyNumeric) return [];
    function dfs(idx, curr) {
      if (idx >= positions.length) { results.add(curr); return; }
      const i = positions[idx], ch = curr[i];
      if (/\d/.test(ch)) {
        const repl = map[ch];
        if (repl) dfs(idx + 1, curr.slice(0, i) + repl + curr.slice(i + 1));
      }
      dfs(idx + 1, curr);
    }
    dfs(0, up);
    results.delete(up);
    return Array.from(results);
  }

  const Modal = (function () {
    const hasModal = typeof window.Modal === 'object' && window.Modal && typeof window.Modal.show === 'function';
    return {
      warnCF(incoherentText, onProceed) {
        const title = 'Incongruenza tra Codice Fiscale e dati anagrafici';
        if (hasModal) {
          window.Modal.show(title, incoherentText, {
            showProceed: true,
            onProceed: () => { try { onProceed && onProceed(); } finally { window.Modal.hide(); } },
            onClose: () => {}
          });
        } else {
          const ok = window.confirm(`${title}\n\n${incoherentText.replace(/<[^>]*>/g,'')}\n\nPremi OK per procedere comunque.`);
          if (ok) onProceed && onProceed();
        }
      },
      warnProv(msgHtml, onProceed, onCancel) {
        const title = 'Attenzione: scuola e residenza sono in province diverse';
        if (hasModal) {
          window.Modal.show(title, msgHtml, {
            showProceed: true,
            onProceed: () => { try { onProceed && onProceed(); } finally { window.Modal.hide(); } },
            onClose: () => { onCancel && onCancel(); }
          });
        } else {
          const ok = window.confirm(`${title}\n\n${msgHtml.replace(/<[^>]*>/g,'')}\n\nPremi OK per procedere comunque.`);
          if (ok) onProceed && onProceed(); else onCancel && onCancel();
        }
      }
    };
  })();

  function setSchoolSectionBlocked(blocked) {
    const section = qs('#section-scuola');
    if (!section) return;
    section.classList.toggle('section--disabled', !!blocked);
    qsa('select', section).forEach(s => s.disabled = !!blocked);
  }

  function findOneOf(selectors) { for (const s of selectors) { const el = qs(s); if (el) return el; } return null; }
  function findAllOf(selectors) { const found = []; selectors.forEach(s => found.push(...qsa(s))); return found; }

  const el = {
    nome: findOneOf(['#nome','input[name="nome"]','[data-field="nome"]']),
    cognome: findOneOf(['#cognome','input[name="cognome"]','[data-field="cognome"]']),
    dataNascita: findOneOf(['#dataNascita','#data_nascita','[name="dataNascita"]']),
    genere: findOneOf(['#genere','#sesso','[name="genere"]','[name="sesso"]']),
    comuneNascita: findOneOf(['#comuneNascita','#comuneNascitaSelect','[name="comuneNascita"]']),
    provinciaNascita: findOneOf(['#provinciaNascita','#provinciaNascitaSelect','[name="provinciaNascita"]']),
    paeseEstero: findOneOf(['#paeseEstero','#paeseNascita','[name="paeseEstero"]']),
    cfParts: (function () {
      const candidates = findAllOf(['#cf1','#cf2','#cf3','#cf4','#cf5','input[id^="cf"]']);
      return candidates.slice().sort((a,b) => {
        const an = parseInt((a.id || '').match(/(\d+)$/)?.[1] || '0', 10);
        const bn = parseInt((b.id || '').match(/(\d+)$/)?.[1] || '0', 10);
        return an - bn;
      });
    })(),
    regioneScuola: findOneOf(['#regioneScuola']),
    provinciaScuola: findOneOf(['#provinciaScuola']),
    comuneScuola: findOneOf(['#comuneScuola']),
    provinciaResidenza: findOneOf(['#provinciaResidenza','#provResidenza','[name="provinciaResidenza"]'])
  };

  function getGenereValue() {
    const radioChecked = qs('input[name="genere"]:checked') || qs('input[name="sesso"]:checked');
    let val = '';
    if (radioChecked && radioChecked.value) val = radioChecked.value;
    else if (el.genere && 'value' in el.genere) val = el.genere.value || '';
    val = String(val).trim().toUpperCase();
    if (val === 'MASCHIO') return 'M';
    if (val === 'FEMMINA') return 'F';
    if (val === 'M' || val === 'F') return val;
    return val.startsWith('M') ? 'M' : (val.startsWith('F') ? 'F' : '');
  }

  const _jsonCache = new Map();
  async function loadJsonLocal(url) {
    if (_jsonCache.has(url)) return _jsonCache.get(url);
    const p = fetch(url, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    _jsonCache.set(url, p);
    return p;
  }

  function normalizeLabelForCompare(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/['’`´]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function resolveBelfioreFromComuneAsync() {
    try {
      if (!el.comuneNascita) return '';
      const sel = el.comuneNascita;
      const value = (sel.value || '').toUpperCase().trim();
      if (/^[A-Z]\d{3}$/.test(value)) return value;
      const opt = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
      if (opt) {
        const ds = opt.dataset || {};
        const d1 = (ds.belfiore || ds.code || '').toUpperCase().trim();
        if (/^[A-Z]\d{3}$/.test(d1)) return d1;
      }
      let comuni = null, geo = null;
      if (window.DataLoader?.loadComuni) comuni = await DataLoader.loadComuni();
      else comuni = await loadJsonLocal('data/data_comuni_min.cleaned.json');
      if (window.DataLoader?.loadGeo) geo = await DataLoader.loadGeo();
      else geo = await loadJsonLocal('data/data_geo_hierarchy_min.cleaned.json');

      const comuneLabelShown = (opt ? opt.textContent : sel.value) || '';
      const comuneKey = normalizeLabelForCompare(comuneLabelShown);

      let provId = null; let provSigla = '';
      if (el.provinciaNascita) {
        const provVal = el.provinciaNascita.value || '';
        const provText = el.provinciaNascita.options && el.provinciaNascita.selectedIndex >= 0
          ? el.provinciaNascita.options[el.provinciaNascita.selectedIndex].textContent
          : provVal;
        provSigla = extractSiglaFromLabel(provVal) || extractSiglaFromLabel(provText) || '';
        if (provSigla && geo?.province) {
          const p = geo.province.find(pp => String(pp.sigla || '').toUpperCase() === provSigla.toUpperCase());
          if (p && p.id != null) provId = p.id;
        }
      }

      const candidates = [];
      for (const c of comuni) {
        const lab = normalizeLabelForCompare(c.label || '');
        const matchLabel = lab === comuneKey;
        const matchAlt = Array.isArray(c.alt) && c.alt.some(a => normalizeLabelForCompare(a) === comuneKey);
        if (matchLabel || matchAlt) {
          if (provId == null || String(c.prov_id) === String(provId)) {
            candidates.push(c);
          }
        }
      }

      if (candidates.length === 1) return String(candidates[0].belfiore || '').toUpperCase();
      if (candidates.length > 1) {
        const exact = candidates.find(c => normalizeLabelForCompare(c.label || '') === comuneKey);
        return String((exact || candidates[0]).belfiore || '').toUpperCase();
      }
      return '';
    } catch (err) {
      console.error('[AdvancedValidator] resolveBelfioreFromComuneAsync error:', err);
      return '';
    }
  }

  let _pendingResolveBelfiore = null;
  function getBelfioreLuogo(syncOnly = false) {
    const comuneVal = el.comuneNascita && el.comuneNascita.value || '';
    const paeseVal  = el.paeseEstero && el.paeseEstero.value || '';
    const c = (comuneVal || '').toUpperCase().trim();
    const p = (paeseVal || '').toUpperCase().trim();
    if (/^[A-Z]\d{3}$/.test(c)) return c;
    if (/^Z\d{3}$/.test(p)) return p;
    if (el.comuneNascita && el.comuneNascita.options && el.comuneNascita.selectedIndex >= 0) {
      const opt = el.comuneNascita.options[el.comuneNascita.selectedIndex];
      const ds = (opt && opt.dataset) || {};
      const d1 = (ds.belfiore || ds.code || '').toUpperCase().trim();
      if (/^[A-Z]\d{3}$/.test(d1)) return d1;
    }
    if (syncOnly) return '';
    if (!_pendingResolveBelfiore) {
      _pendingResolveBelfiore = resolveBelfioreFromComuneAsync()
        .then(code => { _pendingResolveBelfiore = null; if (code) runCfValidation(); })
        .catch(() => { _pendingResolveBelfiore = null; });
    }
    return '';
  }

  function getInsertedCF() {
    if (!el.cfParts || el.cfParts.length === 0) return '';
    const raw = el.cfParts.map(inp => String(inp.value || '')).join('');
    return raw.replace(/\s+/g, '').toUpperCase();
  }

  function getUserData() {
    return {
      nome: el.nome ? String(el.nome.value || '') : '',
      cognome: el.cognome ? String(el.cognome.value || '') : '',
      dataNascita: el.dataNascita ? String(el.dataNascita.value || '') : '',
      genere: getGenereValue(),
      belfioreLuogo: getBelfioreLuogo(/*syncOnly=*/true)
    };
  }

  let overrideCFIncoherence = false;
  let overrideProvinceMismatch = false;
  function resetCFOverride() { overrideCFIncoherence = false; }
  function resetProvinceOverride() { overrideProvinceMismatch = false; }

  // === NEW: funzione che normalizza l'output del calcolatore in una stringa CF di 16 char (se possibile)
  function normalizeCalcOutput(out) {
    if (!out) return '';
    if (typeof out === 'string') return out.toUpperCase().trim();
    if (typeof out === 'object') {
      const cand = out.code || out.cf || out.codiceFiscale || out.codice || '';
      return String(cand || '').toUpperCase().trim();
    }
    return '';
  }

  function runCfValidation() {
    try {
      const cf = getInsertedCF();
      if (cf.length !== 16) return;

      const userSync = getUserData();
      if (!userSync.belfioreLuogo) {
        getBelfioreLuogo(/*syncOnly=*/false);
        return;
      }

      const user = { ...userSync };

      if (!user.nome || !user.cognome || !user.dataNascita || !user.genere || !user.belfioreLuogo) return;

      if (!window.CodiceFiscaleCalculator || typeof CodiceFiscaleCalculator.calculate !== 'function') {
        log('CodiceFiscaleCalculator non disponibile, salto controllo CF.');
        return;
      }

      // === NEW: accetta sia stringa che oggetto come output
      let calcOut;
      try {
        calcOut = CodiceFiscaleCalculator.calculate({
          nome: user.nome,
          cognome: user.cognome,
          data: user.dataNascita,   // YYYY-MM-DD
          genere: user.genere,      // "M" / "F"
          belfiore: user.belfioreLuogo
        });
      } catch (e) {
        console.error('Errore del calcolatore CF:', e);
        return;
      }

      const computed = normalizeCalcOutput(calcOut);

      if (!computed || computed.length !== 16) {
        log('CF calcolato non valido, salto.');
        return;
      }

      const entered = cf.toUpperCase();

      if (entered === computed) return;

      const variants = generateOmocodiaVariants(computed);
      const matchesOmocodia = variants.includes(entered);
      if (matchesOmocodia) return;

      if (overrideCFIncoherence) return;

      const bodyHtml = `
        <p>Il Codice Fiscale inserito non risulta coerente con i dati digitati.</p>
        <ul>
          <li><strong>CF inserito:</strong> ${entered}</li>
          <li><strong>CF calcolato:</strong> ${computed}</li>
        </ul>
        <p>Se sei certo dei dati inseriti, puoi <em>procedere comunque</em>.</p>
      `;
      Modal.warnCF(bodyHtml, () => { overrideCFIncoherence = true; });

    } catch (err) {
      console.error('Errore in runCfValidation:', err);
    }
  }

  const runCfValidationDebounced = debounce(runCfValidation, 300);

  function runProvinceConsistency() {
    try {
      const provRes = el.provinciaResidenza ? el.provinciaResidenza.value : '';
      const provScuVal = el.provinciaScuola ? el.provinciaScuola.value : '';
      if (!provRes || !provScuVal) return;

      const sigRes = extractSiglaFromLabel(provRes) || norm(provRes);
      const sigScu = extractSiglaFromLabel(provScuVal) || norm(provScuVal);
      if (!sigRes || !sigScu) return;

      if (sigRes === sigScu) { setSchoolSectionBlocked(false); return; }
      if (overrideProvinceMismatch) { setSchoolSectionBlocked(false); return; }

      const msg = `
        <p>La provincia della scuola selezionata non coincide con la provincia di residenza.</p>
        <ul>
          <li><strong>Residenza:</strong> ${provRes}</li>
          <li><strong>Scuola:</strong> ${provScuVal}</li>
        </ul>
        <p>Vuoi procedere comunque?</p>
      `;
      setSchoolSectionBlocked(true);
      Modal.warnProv(msg, () => { overrideProvinceMismatch = true; setSchoolSectionBlocked(false); }, () => {});

    } catch (err) {
      console.error('Errore in runProvinceConsistency:', err);
    }
  }

  const runProvinceConsistencyDebounced = debounce(runProvinceConsistency, 150);

  function bindEvents() {
    if (el.cfParts && el.cfParts.length) {
      el.cfParts.forEach(inp => {
        inp.addEventListener('input', () => { resetCFOverride(); runCfValidationDebounced(); });
      });
      const last = el.cfParts[el.cfParts.length - 1];
      last && last.addEventListener('blur', () => { runCfValidation(); });
    }

    if (el.nome) el.nome.addEventListener('input', () => { resetCFOverride(); runCfValidationDebounced(); });
    if (el.cognome) el.cognome.addEventListener('input', () => { resetCFOverride(); runCfValidationDebounced(); });

    if (el.dataNascita) el.dataNascita.addEventListener('change', () => { resetCFOverride(); runCfValidationDebounced(); });
    qsa('input[name="genere"], input[name="sesso"]').forEach(r => {
      r.addEventListener('change', () => { resetCFOverride(); runCfValidationDebounced(); });
    });
    if (el.genere && el.genere.tagName === 'SELECT') {
      el.genere.addEventListener('change', () => { resetCFOverride(); runCfValidationDebounced(); });
    }

    if (el.comuneNascita) el.comuneNascita.addEventListener('change', () => {
      resetCFOverride();
      getBelfioreLuogo(false);
      runCfValidationDebounced();
    });
    if (el.paeseEstero) el.paeseEstero.addEventListener('change', () => { resetCFOverride(); runCfValidationDebounced(); });

    if (el.provinciaNascita) el.provinciaNascita.addEventListener('change', () => {
      resetCFOverride();
      getBelfioreLuogo(false);
      runCfValidationDebounced();
    });

    if (el.provinciaResidenza) el.provinciaResidenza.addEventListener('change', () => { resetProvinceOverride(); runProvinceConsistencyDebounced(); });
    if (el.provinciaScuola) el.provinciaScuola.addEventListener('change', () => { runProvinceConsistencyDebounced(); });
    if (el.regioneScuola) el.regioneScuola.addEventListener('change', () => { resetProvinceOverride(); });
    if (el.comuneScuola) el.comuneScuola.addEventListener('change', () => { runProvinceConsistencyDebounced(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    log('Modulo di validazione avanzato inizializzato.');
    bindEvents();
    setTimeout(() => { runCfValidationDebounced(); runProvinceConsistencyDebounced(); }, 0);
  });

})();

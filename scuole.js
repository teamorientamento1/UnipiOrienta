(function () {
  document.addEventListener('DOMContentLoaded', () => {

    const comuneResidenzaSelect = document.getElementById('comuneResidenza');
    const sectionScuola = document.getElementById('section-scuola');

    let isScuolaInitialized = false;

    const handleComuneResidenzaChange = () => {
      if (comuneResidenzaSelect && comuneResidenzaSelect.value && !isScuolaInitialized) {
        isScuolaInitialized = true;
        sectionScuola.hidden = false;
        initScuolaCascade();
      }
    };

    if (comuneResidenzaSelect) {
      comuneResidenzaSelect.addEventListener('change', handleComuneResidenzaChange);
      // se già selezionato (ritorno da refresh)
      handleComuneResidenzaChange();
    }

    // -------------------------
    // UTIL
    // -------------------------
    const collator = new Intl.Collator('it', { sensitivity: 'base', numeric: false });
    const INFANZIA_RX = /INFANZIA|MATERNA/iu;

    function uniqueSorted(arr) {
      return Array.from(new Set(arr)).sort(collator.compare);
    }

    function toTitleCase(str) {
      if (!str) return '';
      return str
        .toLowerCase()
        .replace(/\b([a-zà-öø-ÿ])([a-zà-öø-ÿ']*)/giu, (m, p1, p2) => p1.toUpperCase() + p2);
    }

    function normalizeProvinceName(str) {
      if (!str) return '';
      // rimuovi (XX) finale, accenti, apostrofi, punteggiatura, spazi multipli
      let s = String(str).replace(/\s*\([A-Z]{2}\)\s*$/, '');
      s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove diacritics
      s = s.replace(/['’`´]/g, ''); // remove apostrophes
      s = s.replace(/[^\w\s/.-]+/g, ''); // keep letters, numbers, space, slash, dot, hyphen
      s = s.replace(/\./g, ' '); // dots to space
      s = s.replace(/\s+/g, ' ').trim();
      return s.toUpperCase();
    }

    function buildProvNameToSigla(geo) {
      const map = new Map();
      if (!geo || !Array.isArray(geo.province)) return map;

      geo.province.forEach(p => {
        const label = String(p.label || '');
        const sigla = String(p.sigla || '').toUpperCase();
        let base = label.replace(/\s*\([A-Z]{2}\)\s*$/, '').trim(); // es. "Pisa (PI)" -> "Pisa"
        // alias principali
        const aliases = new Set();
        aliases.add(base);
        // gestisci slash (Bolzano/Bozen)
        if (base.includes('/')) {
          base.split('/').forEach(part => aliases.add(part.trim()));
          aliases.add(base.replace('/', ' '));
        }
        // gestisci trattini (Barletta-Andria-Trani, Forlì-Cesena)
        if (base.includes('-')) {
          aliases.add(base.replace(/-/g, ' '));
        }
        // alcune forme comuni senza "della"
        if (/e della/i.test(base)) {
          aliases.add(base.replace(/ e della /i, ' e '));
        }
        // normalizza e registra
        aliases.forEach(name => {
          const key = normalizeProvinceName(name);
          if (key) map.set(key, sigla);
        });
      });

      // alias manuali aggiuntivi
      map.set('FORLI CESENA', map.get('FORLI CESENA') || 'FC'); // handle FORLI'-CESENA
      map.set('MONZA E BRIANZA', map.get('MONZA E DELLA BRIANZA') || 'MB');

      return map;
    }

    function extractSiglaFromLabel(label) {
      const m = /\(([A-Z]{2})\)\s*$/.exec(label || '');
      return m ? m[1] : '';
    }

    // -------------------------
    // CASCATA SCUOLA
    // -------------------------
    async function initScuolaCascade() {
      const selects = {
        regione: document.getElementById('regioneScuola'),
        provincia: document.getElementById('provinciaScuola'),
        comune: document.getElementById('comuneScuola'),
        istituto: document.getElementById('istitutoScuola'),
        plesso: document.getElementById('plessoScuola')
      };

      const fields = {
        regione: document.getElementById('field-regione-scuola'),
        provincia: document.getElementById('field-prov-scuola'),
        comune: document.getElementById('field-comune-scuola'),
        istituto: document.getElementById('field-istituto-scuola'),
        plesso: document.getElementById('field-plesso-scuola')
      };

      const HINTS = {
        plesso: document.getElementById('hint-plesso-scuola')
      };

      function resetAndHideFrom(level) {
        const order = ['provincia', 'comune', 'istituto', 'plesso'];
        const idx = order.indexOf(level);
        order.slice(idx).forEach(k => {
          selects[k].innerHTML = '<option value="">Seleziona…</option>';
          selects[k].disabled = true;
          fields[k].hidden = true;
          if (window.activateChoices) window.activateChoices(selects[k].id);
        });
        if (HINTS.plesso) HINTS.plesso.textContent = '';
      }

      function populateSelect(selectEl, items, textMapper, valueMapper) {
        selectEl.innerHTML = '<option value="">Seleziona…</option>';
        items.forEach(item => {
          const opt = document.createElement('option');
          const text = textMapper ? textMapper(item) : String(item);
          const value = valueMapper ? valueMapper(item) : String(item);
          opt.textContent = text;
          opt.value = value;
          selectEl.appendChild(opt);
        });
        selectEl.disabled = false;
        if (window.activateChoices) window.activateChoices(selectEl.id);
      }

      // carica dati
      let allScuoleData = [];
      let geo = null;
      try {
        if (window.DataLoader && DataLoader.loadScuole) {
          allScuoleData = await DataLoader.loadScuole();
        } else {
          const resp = await fetch('data/data_scuole_min.json');
          allScuoleData = await resp.json();
        }
        if (window.DataLoader && DataLoader.loadGeo) {
          geo = await DataLoader.loadGeo();
        } else {
          const respG = await fetch('data/data_geo_hierarchy_min.cleaned.json');
          geo = await respG.json();
        }
      } catch (e) {
        console.error('Errore nel caricamento dei dati scuole/geo:', e);
        return;
      }

      const provNameToSigla = buildProvNameToSigla(geo);

      // REGIONI
      const regioni = uniqueSorted(allScuoleData.map(s => s.regione));
      populateSelect(selects.regione, regioni, (r) => toTitleCase(r), (r) => r);
      fields.regione.hidden = false;

      // default Toscana se presente
      const defaultRegione = 'TOSCANA';
      if (regioni.includes(defaultRegione)) {
        selects.regione.value = defaultRegione;
        selects.regione.dispatchEvent(new Event('change'));
      }
      
      // PROVINCIA
      selects.regione.addEventListener('change', () => {
        resetAndHideFrom('provincia');
        const selectedRegione = selects.regione.value;
        if (!selectedRegione) return;

        const province = uniqueSorted(
          allScuoleData
            .filter(s => s.regione === selectedRegione)
            .map(s => s.provincia)
        );

        // Popola: testo = Nome provincia (senza sigla), value = "Nome (SIGLA)" per compatibilità validator,
        // dataset.provSigla = SIGLA
        populateSelect(
          selects.provincia,
          province,
          (provName) => toTitleCase(provName),
          (provName) => {
            const sigla = provNameToSigla.get(normalizeProvinceName(provName)) || '';
            const base = toTitleCase(provName);
            return sigla ? `${base} (${sigla})` : base; // value compatibile con provinciaResidenza
          }
        );

        // aggiungi data-prov-sigla alle option
        Array.from(selects.provincia.options).forEach(opt => {
          const base = opt.textContent;
          const sig = provNameToSigla.get(normalizeProvinceName(base)) || extractSiglaFromLabel(opt.value);
          if (sig) opt.dataset.provSigla = sig;
        });

        fields.provincia.hidden = false;
      });

      // COMUNE → ISTITUTO (con filtro sugli istituti "solo infanzia")
      selects.provincia.addEventListener('change', () => {
        resetAndHideFrom('comune');
        const regione = selects.regione.value;
        const provinciaLabelShown = selects.provincia.options[selects.provincia.selectedIndex]?.textContent || '';
        if (!regione || !provinciaLabelShown) return;

        const comuni = uniqueSorted(
          allScuoleData
            .filter(s => s.regione === regione && toTitleCase(s.provincia) === provinciaLabelShown)
            .map(s => toTitleCase(s.citta))
        );
        populateSelect(selects.comune, comuni, (c) => c, (c) => c);
        fields.comune.hidden = false;
      });

      // ISTITUTO (filtrato)
      selects.comune.addEventListener('change', () => {
        resetAndHideFrom('istituto');
        const regione = selects.regione.value;
        const provinciaLabelShown = selects.provincia.options[selects.provincia.selectedIndex]?.textContent || '';
        const comune = selects.comune.value;
        if (!regione || !provinciaLabelShown || !comune) return;

        // Righe candidate per quel territorio
        const rows = allScuoleData.filter(s =>
          s.regione === regione &&
          toTitleCase(s.provincia) === provinciaLabelShown &&
          toTitleCase(s.citta) === comune
        );

        // Group by istituto principale e scarta:
        // - istituti con nome contenente INFANZIA/MATERNA
        // - istituti che hanno SOLO plessi di infanzia/materna
        const grouped = new Map();
        for (const s of rows) {
          const ist = s.ist_princ_nome || '';
          const pl = s.plesso_nome || '';
          if (!grouped.has(ist)) grouped.set(ist, []);
          grouped.get(ist).push(pl);
        }

        const istitutiFiltered = [];
        for (const [istituto, plessi] of grouped.entries()) {
          if (INFANZIA_RX.test(istituto)) continue; // nome istituto "infanzia"
          const hasNonInfanziaPlesso = plessi.some(p => !INFANZIA_RX.test(p || ''));
          if (hasNonInfanziaPlesso) istitutiFiltered.push(istituto);
        }

        const istituti = uniqueSorted(istitutiFiltered);
        populateSelect(selects.istituto, istituti, (i) => i, (i) => i);
        fields.istituto.hidden = true; // default
        if (istituti.length > 0) {
          fields.istituto.hidden = false;
        }
      });

      // PLESSO (con filtro: NO INFANZIA/MATERNA)
      selects.istituto.addEventListener('change', () => {
        resetAndHideFrom('plesso');
        const regione = selects.regione.value;
        const provinciaLabelShown = selects.provincia.options[selects.provincia.selectedIndex]?.textContent || '';
        const comune = selects.comune.value;
        const istituto = selects.istituto.value;
        if (!regione || !provinciaLabelShown || !comune || !istituto) return;

        const plessiRaw = allScuoleData
          .filter(s =>
            s.regione === regione &&
            toTitleCase(s.provincia) === provinciaLabelShown &&
            toTitleCase(s.citta) === comune &&
            s.ist_princ_nome === istituto
          )
          .map(s => s.plesso_nome);

        const plessi = uniqueSorted(plessiRaw.filter(p => !INFANZIA_RX.test(p || '')));

        populateSelect(selects.plesso, plessi, (p) => p, (p) => p);
        fields.plesso.hidden = false;

        if (plessi.length === 0 && HINTS.plesso) {
          HINTS.plesso.textContent = "Nessun plesso disponibile per questa combinazione (le scuole dell'infanzia non sono mostrate).";
        }
      });
    }
  });
})();

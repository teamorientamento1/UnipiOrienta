/**
 * SelectCascade.js
 * - Province → Comuni: costruito da geo o, in mancanza, dai record dei comuni (nomi).
 * - Paesi esteri: array puro o {nazioni:[...]} con "ALTRO" in testa.
 * - Ricerca base: filtro per sottostringa (case-insensitive).
 */
const SelectCascade = (() => {
  const collator = new Intl.Collator("it", { sensitivity: "base" });
  const byText = (a,b) => collator.compare(a,b);

  function setOptions(selectEl, values, { placeholder="Seleziona…", prefix=[] }={}){
    selectEl.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = ""; ph.textContent = placeholder;
    selectEl.appendChild(ph);

    prefix.forEach(p => {
      const op = document.createElement("option");
      op.value = p.value; op.textContent = p.label;
      selectEl.appendChild(op);
    });

    values.forEach(v => {
      const op = document.createElement("option");
      op.value = v; op.textContent = v;
      selectEl.appendChild(op);
    });
  }

  function filterList(full, query){
    const q = (query || "").trim().toLowerCase();
    if (!q) return full;
    return full.filter(x => x.toLowerCase().includes(q));
  }

  // ---------- Paesi esteri ----------
  async function initPaesi({ selectEl, searchEl }){
    const raw = await window.DataLoader.loadPaesi();
    const list = window.DataLoader.normalizeCountries(raw);
    const uniq = Array.from(new Set(list.filter(Boolean))).sort(byText);
    const PREFIX = [{ value: "__ALTRO__", label: "ALTRO" }];

    selectEl.disabled = false;
    setOptions(selectEl, uniq, { placeholder: "Seleziona…", prefix: PREFIX });

    if (searchEl){
      searchEl.addEventListener("input", () => {
        const filtered = filterList(uniq, searchEl.value);
        setOptions(selectEl, filtered, { placeholder: "Seleziona…", prefix: PREFIX });
      });
    }

    return {
      get value(){ return selectEl.value; },
      onChange(cb){ selectEl.addEventListener("change", ()=> cb(selectEl.value)); }
    };
  }

  // ---------- Provincia → Comune ----------
  async function initProvinceComune({ provinciaSelect, provinciaSearch, comuneSelect, comuneSearch }){
    // Carica entrambi e costruisci la mappa più coerente possibile
    const [geo, comuni] = await Promise.all([
      window.DataLoader.loadGeo().catch(()=>null),
      window.DataLoader.loadComuni().catch(()=>[])
    ]);

    const provMap = window.DataLoader.buildProvinceMap({ geo, comuni });
    const allProv = window.DataLoader.provincesFromMap(provMap);

    provinciaSelect.disabled = false;
    setOptions(provinciaSelect, allProv, { placeholder: "Seleziona…" });

    function renderComuniFor(prov, query=""){
      const comuni = provMap.get(prov) || [];
      const filtered = filterList(comuni, query);
      setOptions(comuneSelect, filtered, { placeholder: "Seleziona…" });
      comuneSelect.disabled = filtered.length === 0;
    }

    // Eventi
    provinciaSelect.addEventListener("change", () => {
      const prov = provinciaSelect.value;
      if (comuneSearch) { comuneSearch.value = ""; comuneSearch.disabled = !prov; }
      if (prov) { renderComuniFor(prov); } else { comuneSelect.disabled = true; setOptions(comuneSelect, [], { placeholder: "Seleziona…" }); }
    });

    if (provinciaSearch){
      provinciaSearch.addEventListener("input", () => {
        const filteredProv = filterList(allProv, provinciaSearch.value);
        const current = provinciaSelect.value;
        setOptions(provinciaSelect, filteredProv, { placeholder: "Seleziona…" });
        if (filteredProv.includes(current)) provinciaSelect.value = current;
      });
    }

    if (comuneSearch){
      comuneSearch.disabled = true;
      comuneSearch.addEventListener("input", () => {
        const prov = provinciaSelect.value;
        renderComuniFor(prov, comuneSearch.value);
      });
    }

    return {
      get provincia(){ return provinciaSelect.value; },
      get comune(){ return comuneSelect.value; },
      onChange(cb){
        provinciaSelect.addEventListener("change", ()=> cb({ provincia: provinciaSelect.value, comune: comuneSelect.value }));
        comuneSelect.addEventListener("change",   ()=> cb({ provincia: provinciaSelect.value, comune: comuneSelect.value }));
      }
    };
  }

  return { initPaesi, initProvinceComune };
})();

window.SelectCascade = SelectCascade;

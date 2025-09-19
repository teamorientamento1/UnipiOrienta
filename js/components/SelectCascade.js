/**
 * SelectCascade.js
 * - Province → Comuni (da geo_hierarchy)
 * - Paesi esteri (da paesi_esteri.json) con voce “ALTRO” in cima
 * - Ricerca base: filtra per sottostringa (case-insensitive)
 */
const SelectCascade = (() => {
  // Utility
  const byText = (a,b) => a.localeCompare(b, 'it', {sensitivity:'base'});

  async function buildProvinceMap(){
    const geo = await window.DataLoader.loadGeoHierarchy();
    // geo: { Regione: { Provincia: [Comuni...] } }
    const provinceMap = new Map();
    Object.values(geo).forEach(regionObj => {
      Object.entries(regionObj).forEach(([provincia, comuni]) => {
        provinceMap.set(provincia, Array.from(new Set(comuni)).sort(byText));
      });
    });
    return provinceMap; // Map<Provincia, [Comuni]>
  }

  function setOptions(selectEl, values, {placeholder="Seleziona…", prefix=[]}={}){
    selectEl.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholder;
    selectEl.appendChild(ph);

    prefix.forEach(pv => {
      const op = document.createElement("option");
      op.value = pv.value;
      op.textContent = pv.label;
      selectEl.appendChild(op);
    });

    values.forEach(v => {
      const op = document.createElement("option");
      op.value = v;
      op.textContent = v;
      selectEl.appendChild(op);
    });
  }

  function filterList(fullList, query){
    const q = (query || "").trim().toLowerCase();
    if(!q) return fullList;
    return fullList.filter(x => x.toLowerCase().includes(q));
  }

  // ---- Paesi esteri ----
  async function initPaesi({ selectEl, searchEl }){
    const countries = await window.DataLoader.loadCountries();
    const uniq = Array.from(new Set(countries)).sort(byText);
    const PREFIX = [{ value: "__ALTRO__", label: "ALTRO" }];

    // iniziale
    selectEl.disabled = false;
    setOptions(selectEl, uniq, { placeholder: "Seleziona…", prefix: PREFIX });

    // ricerca
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

  // ---- Provincia → Comune ----
  async function initProvinceComune({ provinciaSelect, provinciaSearch, comuneSelect, comuneSearch }){
    const provinceMap = await buildProvinceMap();
    const allProv = Array.from(provinceMap.keys()).sort(byText);

    // Provincia
    provinciaSelect.disabled = false;
    setOptions(provinciaSelect, allProv, { placeholder: "Seleziona…" });

    function renderComuniFor(prov, query=""){
      const comuni = provinceMap.get(prov) || [];
      const filtered = filterList(comuni, query);
      setOptions(comuneSelect, filtered, { placeholder: "Seleziona…" });
      comuneSelect.disabled = filtered.length === 0;
    }

    provinciaSelect.addEventListener("change", () => {
      const prov = provinciaSelect.value;
      comuneSearch.value = "";
      renderComuniFor(prov);
      if (prov) comuneSearch.disabled = false; else { comuneSearch.disabled = true; comuneSelect.disabled = true; }
    });

    if (provinciaSearch){
      provinciaSearch.addEventListener("input", () => {
        const filteredProv = filterList(allProv, provinciaSearch.value);
        const current = provinciaSelect.value;
        setOptions(provinciaSelect, filteredProv, { placeholder: "Seleziona…" });
        if (filteredProv.includes(current)) provinciaSelect.value = current;
      });
    }

    // Comune
    comuneSelect.disabled = true;
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

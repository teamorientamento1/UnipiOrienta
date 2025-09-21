/**
 * SelectCascade.js
 * Gestisce la logica per menu a tendina a cascata (es. Provincia -> Comune)
 * e anche per menu singoli popolati da dati asincroni.
 * VERSIONE ROBUSTA con controlli di dipendenza migliorati.
 */
(function () {
  if (!window.Dom) {
    return console.error("ERRORE CRITICO: Il modulo 'Dom' (da dom.js) non è stato trovato. SelectCascade.js non può essere eseguito.");
  }
  if (!window.DataLoader) {
    return console.error("ERRORE CRITICO: Il modulo 'DataLoader' (da dataLoader.js) non è stato trovato. SelectCascade.js non può essere eseguito.");
  }

  const { show, hide } = window.Dom;
  const { DataLoader } = window;

  class Cascade {
    constructor(config) {
      this.config = config;
      this.provinciaSelect = document.getElementById(config.provinciaSelectId);
      this.comuneSelect = document.getElementById(config.comuneSelectId);
      this.fieldComune = this.comuneSelect ? document.getElementById(config.fieldComuneId) : null;
      this.onChangeCallback = () => {};
      this._init();
    }

    async _init() {
      try {
        const [geo, comuni] = await Promise.all([
          DataLoader.loadGeo(),
          DataLoader.loadComuni()
        ]);
        this.provinceMap = DataLoader.buildProvinceMap({ geo, comuni });
        const province = DataLoader.provincesFromMap(this.provinceMap);
        
        this._populateSelect(this.provinciaSelect, province);
        this.provinciaSelect.disabled = false;
        
        if (window.activateChoices) {
          window.activateChoices(this.config.provinciaSelectId);
        }

        if (this.config.defaultValue && Array.from(this.provinciaSelect.options).some(opt => opt.value === this.config.defaultValue)) {
          this.provinciaSelect.value = this.config.defaultValue;
          this.provinciaSelect.dispatchEvent(new Event('change'));
        }

        this.provinciaSelect.addEventListener('change', () => this._onProvinciaChange());
        if(this.comuneSelect) {
            this.comuneSelect.addEventListener('change', () => this._onComuneChange());
        }

      } catch (e) {
        console.error("Impossibile inizializzare la cascata geografica:", e);
      }
    }

    _populateSelect(selectEl, options) {
      selectEl.innerHTML = '<option value="">Seleziona…</option>';
      options.forEach(opt => {
        const optionEl = document.createElement('option');
        if (typeof opt === 'object' && opt !== null && opt.label) {
          optionEl.value = opt.label;
          optionEl.textContent = opt.label;
          optionEl.dataset.belfiore = opt.code; 
        } else {
          optionEl.value = opt;
          optionEl.textContent = opt;
        }
        selectEl.appendChild(optionEl);
      });
    }

    _onProvinciaChange() {
      const selectedProvincia = this.provinciaSelect.value;
      if (this.comuneSelect) {
          const comuni = this.provinceMap.get(selectedProvincia) || [];
          this._populateSelect(this.comuneSelect, comuni);
          this.comuneSelect.disabled = !selectedProvincia;
          selectedProvincia ? show(this.fieldComune) : hide(this.fieldComune);
          
          if (window.activateChoices) {
             window.activateChoices(this.config.comuneSelectId);
          }
      }
      this.onChangeCallback({
        provincia: selectedProvincia,
        comune: null
      });
    }

    _onComuneChange() {
        this.onChangeCallback({
            provincia: this.provinciaSelect.value,
            comune: this.comuneSelect.value
        });
    }

    onChange(callback) {
      if (typeof callback === 'function') {
        this.onChangeCallback = callback;
      }
    }
  }

  async function initPaesi(selectId) {
     try {
        const selectEl = document.getElementById(selectId);
        if(!selectEl) throw new Error(`Elemento #${selectId} non trovato`);

        const paesi = await DataLoader.loadPaesi();
        
        selectEl.innerHTML = '<option value="">Seleziona…</option>';
        paesi.forEach(paese => {
            const option = document.createElement('option');
            option.value = paese.label;
            option.textContent = paese.label;
            option.dataset.belfiore = paese.belfiore;
            selectEl.appendChild(option);
        });

        selectEl.disabled = false;
        if(window.activateChoices) window.activateChoices(selectId);
        return selectEl;

     } catch(e) {
        console.error("Errore nel caricamento dei paesi:", e);
        const hintEl = document.querySelector(`#field-paese-estero .hint`);
        if (hintEl) hintEl.textContent = 'Errore nel caricamento della lista dei paesi.';
     }
  }

  window.SelectCascade = {
    initProvinceComune: (config) => new Cascade(config),
    initPaesi: initPaesi
  };
})();
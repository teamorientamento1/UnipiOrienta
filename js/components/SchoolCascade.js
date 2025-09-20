/* SchoolCascade.js
 * - Combobox con ricerca integrata (SelectCascade)
 * - Cascata Scuola: Regione → Provincia → Città → Istituto → Plesso
 * - ALTRO abilitato SOLO da Città in giù (Città, Istituto, Plesso)
 * - Auto-initialization su DOMContentLoaded e CSS iniettato
 */
(function(){
  // ---------- Utilità ----------
  const collator = new Intl.Collator("it", { sensitivity: "base" });
  const titleCase = (str) => {
    return String(str || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/(^|[\s'’\-])([a-zàèéìòù])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  };
  const uniqSorted = (arr) => Array.from(new Set(arr.filter(Boolean))).sort(collator.compare);

  // ---------- Stili minimi (scopo locale) ----------
  const STYLE_TAG_ID = "school-cascade-inline-style";
  const ensureStyles = () => {
    if (document.getElementById(STYLE_TAG_ID)) return;
    const css = `
.school-cascade { margin-top: 1rem; display: grid; gap: 12px; }
.school-cascade__row { display: grid; gap: 6px; }
.school-cascade__label { font-weight: 600; }
.combo { position: relative; max-width: 600px; }
.combo[aria-disabled="true"] { opacity: .6; pointer-events: none; }
.combo__button { width: 100%; min-height: 40px; border: 1px solid #d0d5dd; border-radius: 8px; background: #fff; padding: 8px 12px; text-align: left; }
.combo__button:focus { outline: 2px solid #04477B40; }
.combo__label--placeholder { color: #98a2b3; }
.combo__panel { position: absolute; z-index: 10; left: 0; right: 0; top: calc(100% + 4px); border: 1px solid #d0d5dd; border-radius: 10px; background: #fff; box-shadow: 0 8px 16px rgba(0,0,0,.08); padding: 8px; max-height: 320px; overflow: auto; }
.combo__search { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; }
.combo__list { list-style: none; margin: 0; padding: 0; }
.combo__option { padding: 8px 10px; border-radius: 6px; cursor: pointer; }
.combo__option:hover, .combo__option[aria-selected="true"] { background: #f2f4f7; }
.combo__option--altro { font-weight: 600; border-top: 1px dashed #e5e7eb; margin-top: 6px; padding-top: 10px; }
.combo__manual { margin-top: 6px; display: grid; gap: 8px; }
.combo__manual-input { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; }
.combo__manual-back { justify-self: start; border: 1px solid #d0d5dd; background: #fff; border-radius: 8px; padding: 6px 10px; }
@media (max-width: 640px){
  .school-cascade { gap: 10px; }
  .combo__panel { max-height: 70vh; }
}
    `.trim();
    const tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    tag.textContent = css;
    document.head.appendChild(tag);
  };

  // ---------- SelectCascade (combobox con ricerca + ALTRO opzionale) ----------
  class SelectCascade {
    constructor(container, {
      placeholder = "Seleziona…",
      ariaLabel = "",
      searchable = true,
      allowAltro = false,
      titleCaseManual = true,
      onChange = () => {}
    } = {}) {
      this.container = container;
      this.options = [];
      this.filtered = [];
      this.open = false;
      this.disabled = false;
      this.allowAltro = !!allowAltro;
      this.searchable = !!searchable;
      this.titleCaseManual = !!titleCaseManual;
      this.onChange = onChange;
      this.value = null;         // string
      this.isManual = false;     // se true, usa manualInput
      this.manualValue = "";

      this._buildDOM(placeholder, ariaLabel);
      this._bindEvents();
      this._renderList();
      this.close();
      this.setEnabled(true);
    }

    _buildDOM(placeholder, ariaLabel){
      this.root = document.createElement("div");
      this.root.className = "combo";
      this.root.setAttribute("role", "combobox");
      this.root.setAttribute("aria-expanded", "false");
      this.root.setAttribute("aria-disabled", "false");
      if (ariaLabel) this.root.setAttribute("aria-label", ariaLabel);

      // Button
      this.btn = document.createElement("button");
      this.btn.type = "button";
      this.btn.className = "combo__button";
      this.btn.innerHTML = `<span class="combo__label combo__label--placeholder">${placeholder}</span>`;
      this.root.appendChild(this.btn);

      // Panel
      this.panel = document.createElement("div");
      this.panel.className = "combo__panel";
      this.panel.hidden = true;

      if (this.searchable){
        this.search = document.createElement("input");
        this.search.className = "combo__search";
        this.search.placeholder = "Cerca…";
        this.panel.appendChild(this.search);
      } else {
        this.search = null;
      }

      this.list = document.createElement("ul");
      this.list.className = "combo__list";
      this.list.setAttribute("role", "listbox");
      this.panel.appendChild(this.list);

      this.root.appendChild(this.panel);

      // Manual section (ALTRO)
      this.manualWrap = document.createElement("div");
      this.manualWrap.className = "combo__manual";
      this.manualWrap.hidden = true;
      this.manualInput = document.createElement("input");
      this.manualInput.className = "combo__manual-input";
      this.manualInput.placeholder = "Inserisci...";
      this.manualBack = document.createElement("button");
      this.manualBack.type = "button";
      this.manualBack.className = "combo__manual-back";
      this.manualBack.textContent = "Torna alla lista";
      this.manualWrap.appendChild(this.manualInput);
      this.manualWrap.appendChild(this.manualBack);
      this.root.appendChild(this.manualWrap);

      this.container.innerHTML = "";
      this.container.appendChild(this.root);
    }

    _bindEvents(){
      // toggle open
      this.btn.addEventListener("click", () => {
        if (this.isManual) return; // in manual mode, button non apre
        this.open ? this.close() : this.openPanel();
      });

      // search filter
      if (this.search) {
        this.search.addEventListener("input", () => this._applyFilter());
        this.search.addEventListener("keydown", (e) => {
          if (e.key === "Escape") { this.close(); this.btn.focus(); }
        });
      }

      // manual input
      this.manualInput.addEventListener("input", () => {
        this.manualValue = this.titleCaseManual ? titleCase(this.manualInput.value) : this.manualInput.value;
        this.onChange(this.getValue());
      });
      this.manualInput.addEventListener("blur", () => {
        this.manualInput.value = this.titleCaseManual ? titleCase(this.manualInput.value) : this.manualInput.value;
        this.manualValue = this.manualInput.value;
        this.onChange(this.getValue());
      });
      this.manualBack.addEventListener("click", () => {
        this.setManualMode(false);
        this.onChange(this.getValue());
      });

      // outside click
      document.addEventListener("click", (e) => {
        if (!this.root.contains(e.target)) this.close();
      });
    }

    _applyFilter(){
      const q = (this.search?.value || "").trim().toLowerCase();
      if (!q) {
        this.filtered = [...this.options];
      } else {
        this.filtered = this.options.filter(opt => opt.toLowerCase().includes(q));
      }
      this._renderList();
    }

    _renderList(){
      this.list.innerHTML = "";
      const mkItem = (label, extraClass="") => {
        const li = document.createElement("li");
        li.className = `combo__option ${extraClass}`.trim();
        li.textContent = label;
        li.setAttribute("role", "option");
        li.tabIndex = 0;
        li.addEventListener("click", () => this._select(label));
        li.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") this._select(label);
          if (e.key === "Escape") this.close();
        });
        return li;
      };

      if (this.allowAltro) {
        const altro = mkItem("— ALTRO —", "combo__option--altro");
        this.list.appendChild(altro);
      }

      const arr = this.filtered.length ? this.filtered : this.options;
      if (!arr.length){
        const li = document.createElement("li");
        li.className = "combo__option";
        li.textContent = "Nessun risultato. Prova ALTRO.";
        li.setAttribute("aria-disabled", "true");
        this.list.appendChild(li);
        return;
      }

      for (const opt of arr) {
        this.list.appendChild(mkItem(opt));
      }
    }

    _select(label){
      if (this.allowAltro && label === "— ALTRO —"){
        this.setManualMode(true);
        this.onChange(this.getValue());
        return;
      }
      this.value = label;
      this.isManual = false;
      this.manualValue = "";
      this._updateButtonLabel();
      this.close();
      this.onChange(this.getValue());
    }

    _updateButtonLabel(){
      const span = this.btn.querySelector(".combo__label");
      if (!this.value){
        span.textContent = "Seleziona…";
        span.classList.add("combo__label--placeholder");
      } else {
        span.textContent = this.value;
        span.classList.remove("combo__label--placeholder");
      }
    }

    openPanel(){
      if (this.disabled) return;
      this.open = true;
      this.root.setAttribute("aria-expanded", "true");
      this.panel.hidden = false;
      if (this.search) {
        this.search.value = "";
        this._applyFilter();
        setTimeout(() => this.search.focus(), 0);
      }
    }
    close(){
      this.open = false;
      this.root.setAttribute("aria-expanded", "false");
      this.panel.hidden = true;
    }

    setOptions(options){
      this.options = uniqSorted(options || []);
      this.filtered = [...this.options];
      this._renderList();
      // reset value if non presente più
      if (this.value && !this.options.includes(this.value)) {
        this.value = null;
        this._updateButtonLabel();
        this.onChange(this.getValue());
      }
    }

    setEnabled(enabled){
      this.disabled = !enabled;
      this.root.setAttribute("aria-disabled", enabled ? "false" : "true");
      this.btn.disabled = !enabled;
      if (!enabled) this.close();
    }

    setManualMode(manual){
      this.isManual = !!manual;
      this.panel.hidden = true;
      this.root.setAttribute("aria-expanded", "false");
      this.open = false;

      if (this.isManual){
        this.manualWrap.hidden = false;
        this.btn.disabled = true;
        this.value = null;
        this.manualInput.value = this.manualValue || "";
        setTimeout(()=> this.manualInput.focus(), 0);
      } else {
        this.manualWrap.hidden = true;
        this.btn.disabled = this.disabled;
        this.manualValue = "";
        this._updateButtonLabel();
      }
    }

    allowAltroFromNow(allow){
      this.allowAltro = !!allow;
      this._renderList();
    }

    reset(){
      this.value = null;
      this.isManual = false;
      this.manualValue = "";
      this._updateButtonLabel();
      this.setEnabled(true);
    }

    getValue(){
      if (this.isManual) {
        return { value: (this.titleCaseManual ? titleCase(this.manualValue) : this.manualValue) || "", manual: true };
      }
      return { value: this.value || "", manual: false };
    }
  }

  // ---------- SchoolCascade orchestrator ----------
  class SchoolCascade {
    constructor(rootContainer){
      this.rootContainer = rootContainer;
      this.data = []; // array di {regione, provincia, citta, ist_princ_nome, plesso_nome}
      // componenti
      this.cmbRegione = null;
      this.cmbProvincia = null;
      this.cmbCitta = null;
      this.cmbIstituto = null;
      this.cmbPlesso = null;
    }

    async init(){
      ensureStyles();
      await this._ensureContainer();
      await this._loadData();
      this._buildUI();
      this._wireEvents();
      this._primeRegioni();
    }

    async _ensureContainer(){
      if (this.rootContainer) return;

      // prova a trovare un contenitore già presente
      let container = document.getElementById("school-cascade");
      if (!container){
        // cerca l'H2 "Informazioni sulla scuola" e inserisci sotto
        const h2s = Array.from(document.querySelectorAll("h2, .h2, [data-section-title]"));
        let anchor = null;
        for (const el of h2s){
          const txt = (el.textContent || "").toLowerCase();
          if (txt.includes("informazioni sulla scuola")) { anchor = el; break; }
        }
        container = document.createElement("div");
        container.id = "school-cascade";
        container.className = "school-cascade";
        if (anchor && anchor.parentNode){
          anchor.parentNode.insertBefore(container, anchor.nextSibling);
        } else {
          document.body.appendChild(container);
        }
      }
      this.rootContainer = container;
    }

    async _loadData(){
      // Prova 'data/scuole_min.json', fallback 'data/data_scuole_min.json'
      const tryFetch = async (url) => {
        const res = await fetch(url + "?v=1", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      };
      try {
        this.data = await tryFetch("data/scuole_min.json");
      } catch {
        this.data = await tryFetch("data/data_scuole_min.json");
      }
      // normalizza chiavi e ripulisci
      this.data = (Array.isArray(this.data) ? this.data : []).map(r => ({
        regione: String(r.regione ?? "").trim(),
        provincia: String(r.provincia ?? "").trim(),
        citta: String(r.citta ?? "").trim(),
        ist_princ_nome: String(r.ist_princ_nome ?? "").trim(),
        plesso_nome: String(r.plesso_nome ?? "").trim(),
      }));
    }

    _buildUI(){
      this.rootContainer.innerHTML = "";

      const mkRow = (labelTxt, id) => {
        const row = document.createElement("div");
        row.className = "school-cascade__row";
        const label = document.createElement("label");
        label.className = "school-cascade__label";
        label.textContent = labelTxt;
        const box = document.createElement("div");
        box.id = id;
        row.appendChild(label);
        row.appendChild(box);
        this.rootContainer.appendChild(row);
        return box;
      };

      const boxReg = mkRow("Regione", "sc_regione");
      const boxProv = mkRow("Provincia", "sc_provincia");
      const boxCity = mkRow("Città", "sc_citta");
      const boxIstit = mkRow("Istituto principale", "sc_istituto");
      const boxPlesso = mkRow("Plesso", "sc_plesso");

      this.cmbRegione = new SelectCascade(boxReg, { ariaLabel: "Regione", searchable: true, allowAltro: false, onChange: () => this._onRegioneChange() });
      this.cmbProvincia = new SelectCascade(boxProv, { ariaLabel: "Provincia", searchable: true, allowAltro: false, onChange: () => this._onProvinciaChange() });
      this.cmbCitta = new SelectCascade(boxCity, { ariaLabel: "Città", searchable: true, allowAltro: true, onChange: () => this._onCittaChange() });
      this.cmbIstituto = new SelectCascade(boxIstit, { ariaLabel: "Istituto", searchable: true, allowAltro: true, onChange: () => this._onIstitutoChange() });
      this.cmbPlesso = new SelectCascade(boxPlesso, { ariaLabel: "Plesso", searchable: true, allowAltro: true, onChange: () => this._onPlessoChange() });

      // all'inizio: solo Regione attiva
      this.cmbProvincia.setEnabled(false);
      this.cmbCitta.setEnabled(false);
      this.cmbIstituto.setEnabled(false);
      this.cmbPlesso.setEnabled(false);
    }

    _wireEvents(){
      // (già passati via onChange dei componenti)
    }

    _primeRegioni(){
      const regioni = uniqSorted(this.data.map(d => d.regione));
      this.cmbRegione.setOptions(regioni);
    }

    _onRegioneChange(){
      const { value: reg, manual } = this.cmbRegione.getValue();
      // Regione non prevede ALTRO → manual non dovrebbe mai essere true
      if (!reg){
        this.cmbProvincia.setOptions([]); this.cmbProvincia.setEnabled(false);
        this._resetDownFrom("provincia");
        return;
      }
      const province = uniqSorted(this.data.filter(d => d.regione === reg).map(d => d.provincia));
      this.cmbProvincia.setOptions(province);
      this.cmbProvincia.setEnabled(true);

      this._resetDownFrom("provincia");
    }

    _onProvinciaChange(){
      const reg = this.cmbRegione.getValue().value;
      const { value: prov } = this.cmbProvincia.getValue();

      if (!reg || !prov){
        this.cmbCitta.setOptions([]); this.cmbCitta.setEnabled(false);
        this._resetDownFrom("citta");
        return;
      }

      const citta = uniqSorted(this.data.filter(d => d.regione === reg && d.provincia === prov).map(d => d.citta));
      this.cmbCitta.allowAltroFromNow(true); // ALTRO da qui in giù
      this.cmbCitta.setOptions(citta);
      this.cmbCitta.setEnabled(true);

      this._resetDownFrom("citta");
    }

    _onCittaChange(){
      const reg = this.cmbRegione.getValue().value;
      const prov = this.cmbProvincia.getValue().value;
      const { value: city, manual } = this.cmbCitta.getValue();

      if (!reg || !prov){
        this._resetDownFrom("citta");
        return;
      }

      if (manual){
        // CITTÀ in manuale → istituto e plesso manuale
        this.cmbIstituto.setManualMode(true);
        this.cmbIstituto.setEnabled(true);
        this.cmbPlesso.setManualMode(true);
        this.cmbPlesso.setEnabled(true);
        return;
      }

      if (!city){
        this.cmbIstituto.setOptions([]); this.cmbIstituto.setEnabled(false);
        this._resetDownFrom("istituto");
        return;
      }

      const istituti = uniqSorted(this.data
        .filter(d => d.regione === reg && d.provincia === prov && d.citta === city)
        .map(d => d.ist_princ_nome));

      this.cmbIstituto.allowAltroFromNow(true);
      this.cmbIstituto.setOptions(istituti);
      this.cmbIstituto.setEnabled(true);

      this._resetDownFrom("istituto");
    }

    _onIstitutoChange(){
      const reg = this.cmbRegione.getValue().value;
      const prov = this.cmbProvincia.getValue().value;
      const city = this.cmbCitta.getValue().value;
      const { value: ist, manual } = this.cmbIstituto.getValue();

      if (!reg || !prov){
        this._resetDownFrom("istituto");
        return;
      }

      if (manual){
        // ISTITUTO manuale → plesso manuale
        this.cmbPlesso.setManualMode(true);
        this.cmbPlesso.setEnabled(true);
        return;
      }

      if (!city || !ist){
        this.cmbPlesso.setOptions([]); this.cmbPlesso.setEnabled(false);
        this._resetDownFrom("plesso");
        return;
      }

      const plessi = uniqSorted(this.data
        .filter(d => d.regione === reg && d.provincia === prov && d.citta === city && d.ist_princ_nome === ist)
        .map(d => d.plesso_nome));

      this.cmbPlesso.allowAltroFromNow(true);
      this.cmbPlesso.setOptions(plessi);
      this.cmbPlesso.setEnabled(true);
    }

    _onPlessoChange(){
      // qui potresti leggere i valori finali se servono (per debug/log)
      // const out = this.getSelection();
      // console.log("SCUOLA →", out);
    }

    _resetDownFrom(level){
      if (level === "provincia" || level === "citta" || level === "istituto" || level === "plesso"){
        this.cmbCitta.reset(); this.cmbCitta.setEnabled(false); this.cmbCitta.allowAltroFromNow(true);
      }
      if (level === "citta" || level === "istituto" || level === "plesso"){
        this.cmbIstituto.reset(); this.cmbIstituto.setEnabled(false); this.cmbIstituto.allowAltroFromNow(true);
      }
      if (level === "istituto" || level === "plesso"){
        this.cmbPlesso.reset(); this.cmbPlesso.setEnabled(false); this.cmbPlesso.allowAltroFromNow(true);
      }
    }

    getSelection(){
      return {
        regione: this.cmbRegione.getValue(),
        provincia: this.cmbProvincia.getValue(),
        citta: this.cmbCitta.getValue(),
        istituto: this.cmbIstituto.getValue(),
        plesso: this.cmbPlesso.getValue()
      };
    }
  }

  // ---------- Auto init ----------
  function autoInit(){
    const sc = new SchoolCascade(null);
    sc.init().catch(err => {
      console.error("[SchoolCascade] init error:", err);
    });
    // esponi per debug
    window.SchoolCascade = SchoolCascade;
    window.SelectCascade = SelectCascade;
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})();

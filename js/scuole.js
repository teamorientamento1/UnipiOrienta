(function () {
  document.addEventListener('DOMContentLoaded', () => {

    const comuneResidenzaSelect = document.getElementById('comuneResidenza');
    const sectionScuola = document.getElementById('section-scuola');

    let isScuolaInitialized = false;

    const handleComuneResidenzaChange = () => {
      if (comuneResidenzaSelect.value && !isScuolaInitialized) {
        isScuolaInitialized = true;
        sectionScuola.hidden = false;
        initScuolaCascade();
      }
    };

    comuneResidenzaSelect.addEventListener('change', handleComuneResidenzaChange);

    const initScuolaCascade = () => {
      let allScuoleData = [];

      const selects = {
        regione: document.getElementById('regioneScuola'),
        provincia: document.getElementById('provinciaScuola'),
        comune: document.getElementById('comuneScuola'),
        istituto: document.getElementById('istitutoScuola'),
        plesso: document.getElementById('plessoScuola')
      };

      const fields = {
        provincia: document.getElementById('field-prov-scuola'),
        comune: document.getElementById('field-comune-scuola'),
        istituto: document.getElementById('field-istituto-scuola'),
        plesso: document.getElementById('field-plesso-scuola')
      };

      const populateSelect = (selectElement, items) => {
        const uniqueSortedItems = [...new Set(items)].filter(Boolean).sort();
        selectElement.innerHTML = '<option value="">Seleziona…</option>';
        uniqueSortedItems.forEach(item => {
          const option = document.createElement('option');
          option.value = item;
          option.textContent = item;
          selectElement.appendChild(option);
        });
        selectElement.disabled = false;
      };

      const resetAndHideFrom = (startLevel) => {
        const levels = ['provincia', 'comune', 'istituto', 'plesso'];
        const startIndex = levels.indexOf(startLevel);

        if (startIndex !== -1) {
          for (let i = startIndex; i < levels.length; i++) {
            const level = levels[i];
            selects[level].innerHTML = '<option value="">Seleziona…</option>';
            selects[level].disabled = true;
            fields[level].hidden = true;
          }
        }
      };

      fetch('data/data_scuole_min.json')
        .then(response => {
          if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
          return response.json();
        })
        .then(data => {
          allScuoleData = data;
          const regioni = allScuoleData.map(scuola => scuola.regione);
          populateSelect(selects.regione, regioni);

          // ✅ BLOCCO DI CODICE RIMOSSO
          // Le righe che impostavano "Toscana" di default sono state eliminate da qui.
          
        })
        .catch(error => console.error('Errore nel caricamento del file JSON delle scuole:', error));

      selects.regione.addEventListener('change', () => {
        resetAndHideFrom('provincia');
        const selectedRegione = selects.regione.value;
        if (selectedRegione) {
          const province = allScuoleData
            .filter(scuola => scuola.regione === selectedRegione)
            .map(scuola => scuola.provincia);
          populateSelect(selects.provincia, province);
          fields.provincia.hidden = false;
        }
      });

      selects.provincia.addEventListener('change', () => {
        resetAndHideFrom('comune');
        const selectedRegione = selects.regione.value;
        const selectedProvincia = selects.provincia.value;
        if (selectedProvincia) {
          const comuni = allScuoleData
            .filter(scuola => scuola.regione === selectedRegione && scuola.provincia === selectedProvincia)
            .map(scuola => scuola.citta);
          populateSelect(selects.comune, comuni);
          fields.comune.hidden = false;
        }
      });

      selects.comune.addEventListener('change', () => {
        resetAndHideFrom('istituto');
        const selectedRegione = selects.regione.value;
        const selectedProvincia = selects.provincia.value;
        const selectedComune = selects.comune.value;
        if (selectedComune) {
          const istituti = allScuoleData
            .filter(scuola =>
              scuola.regione === selectedRegione &&
              scuola.provincia === selectedProvincia &&
              scuola.citta === selectedComune
            )
            .map(scuola => scuola.ist_princ_nome);
          populateSelect(selects.istituto, istituti);
          fields.istituto.hidden = false;
        }
      });

      selects.istituto.addEventListener('change', () => {
        resetAndHideFrom('plesso');
        const selectedRegione = selects.regione.value;
        const selectedProvincia = selects.provincia.value;
        const selectedComune = selects.comune.value;
        const selectedIstituto = selects.istituto.value;
        if (selectedIstituto) {
          const plessi = allScuoleData
            .filter(scuola =>
              scuola.regione === selectedRegione &&
              scuola.provincia === selectedProvincia &&
              scuola.citta === selectedComune &&
              scuola.ist_princ_nome === selectedIstituto
            )
            .map(scuola => scuola.plesso_nome);
          populateSelect(selects.plesso, plessi);
          fields.plesso.hidden = false;
        }
      });

      const sectionContatti = document.getElementById('section-contatti');
      const sectionSubmit = document.getElementById('section-submit');
      
      selects.plesso.addEventListener('change', () => {
        if (selects.plesso.value) {
          sectionContatti.hidden = false;
          sectionSubmit.hidden = false;
        } else {
          sectionContatti.hidden = true;
          sectionSubmit.hidden = true;
        }
      });
    };
  });
})();

// Funzione auto-eseguibile per non inquinare lo scope globale
(function () {
  // Attende che il DOM sia completamente caricato prima di eseguire lo script
  document.addEventListener('DOMContentLoaded', () => {

    // --- RIFERIMENTI AL DOM ---
    const comuneResidenzaSelect = document.getElementById('comuneResidenza');
    const sectionScuola = document.getElementById('section-scuola');

    let isScuolaInitialized = false; // Flag per inizializzare la sezione una sola volta

    /**
     * Mostra la sezione scuola e avvia la logica a cascata.
     */
    const handleComuneResidenzaChange = () => {
      // Se è stato selezionato un comune e la sezione non è ancora stata inizializzata...
      if (comuneResidenzaSelect.value && !isScuolaInitialized) {
        isScuolaInitialized = true; // Imposta il flag per non ripetere l'operazione
        sectionScuola.hidden = false; // Mostra la sezione
        initScuolaCascade(); // Avvia il popolamento dei menu a cascata
      }
    };

    // Aggiunge l'ascoltatore di eventi al menu del comune di residenza
    comuneResidenzaSelect.addEventListener('change', handleComuneResidenzaChange);

    /**
     * Inizializza tutta la logica per i menu a cascata della scuola.
     * Carica i dati e imposta gli event listener.
     */
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

      // --- CARICAMENTO DATI E POPOLAMENTO INIZIALE ---
      fetch('data/data_scuole_min.json')
        .then(response => {
          if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
          return response.json();
        })
        .then(data => {
          allScuoleData = data;
          const regioni = allScuoleData.map(scuola => scuola.regione);
          populateSelect(selects.regione, regioni);
        })
        .catch(error => console.error('Errore nel caricamento del file JSON delle scuole:', error));

      // --- GESTORI DI EVENTI A CASCATA ---
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
            .map(scuola => scuola.comune);
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
              scuola.comune === selectedComune
            )
            .map(scuola => scuola.denominazione_istituto);
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
              scuola.comune === selectedComune &&
              scuola.denominazione_istituto === selectedIstituto
            )
            .map(scuola => scuola.denominazione_plesso);
          populateSelect(selects.plesso, plessi);
          fields.plesso.hidden = false;
        }
      });
    }; // Fine di initScuolaCascade

  }); // Fine di DOMContentLoaded
})();
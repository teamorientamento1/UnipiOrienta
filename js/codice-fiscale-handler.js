(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const cfContainer = document.querySelector('.cf-container');
    if (!cfContainer) return;

    // ✅ MODIFICA: Selezioniamo il contenitore del campo per la validazione
    const fieldCf = document.getElementById('field-cf');
    const inputs = Array.from(cfContainer.querySelectorAll('.cf-segment'));
    const hint = document.getElementById('hint-cf');

    const resetFrom = (startIndex) => {
      for (let i = startIndex; i < inputs.length; i++) {
        inputs[i].value = '';
        inputs[i].classList.add('hidden');
        inputs[i].classList.remove('error');
      }
      // ✅ MODIFICA: Pulisce lo stato (sia ok che error)
      window.Dom.clearError(fieldCf);
      hint.textContent = ''; // Assicura che l'hint venga svuotato
    };

    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        const { value, maxLength } = input;
        input.classList.remove('error');

        if (value.length === 0) {
          resetFrom(index + 1);
        }

        // Se la casella è piena, mostra la successiva MA NON SPOSTA IL FOCUS
        if (value.length >= maxLength && index < inputs.length - 1) {
          const nextInput = inputs[index + 1];
          nextInput.classList.remove('hidden');
        }

        if (inputs.every(i => i.value.length === i.maxLength)) {
          validateAndHighlight();
        } else {
          // ✅ MODIFICA: Se il CF non è completo, pulisce lo stato
          window.Dom.clearError(fieldCf);
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
          // Gestione backspace
        }
      });
    });

    const validateAndHighlight = () => {
      inputs.forEach(input => input.classList.remove('error'));
      const cf = inputs.map(input => input.value).join('').toUpperCase();
      if (cf.length !== 16) return;

      const result = validateCodiceFiscale(cf);

      if (result.isValid) {
        // ✅ MODIFICA: Usa la nuova funzione per lo stato di successo
        window.Dom.setOk(fieldCf, 'Codice Fiscale formalmente valido.');
        document.getElementById('group-nomecognome').hidden = false;
      } else {
        // ✅ MODIFICA: Usa la nuova funzione per lo stato di errore
        window.Dom.setError(fieldCf, result.message);
        highlightErrorSegment(result.errorIndex);
      }
    };

    const highlightErrorSegment = (errorIndex) => {
      if (errorIndex === -1) return;
      let segmentIndex = 0;
      if (errorIndex < 6) segmentIndex = 0; // Cognome+Nome
      else if (errorIndex < 8) segmentIndex = 1; // Anno
      else if (errorIndex < 9) segmentIndex = 2; // Mese
      else if (errorIndex < 11) segmentIndex = 3; // Giorno
      else if (errorIndex < 15) segmentIndex = 4; // Comune
      else if (errorIndex === 15) segmentIndex = 4; // Controllo (evidenzia l'ultimo)
      
      // La logica precedente era un po' off, questa è più precisa
      const lengthMap = [6, 2, 1, 2, 5]; 
      let cumulativeLength = 0;
      for (let i = 0; i < lengthMap.length; i++) {
        cumulativeLength += lengthMap[i];
        if (errorIndex < cumulativeLength) {
            segmentIndex = i;
            break;
        }
      }
      
      // Fallback per l'ultimo carattere
      if (errorIndex === 15) {
        segmentIndex = 4; 
      }

      // Correggo la mappatura ai 5 input attuali
      const inputMap = [
          { start: 0, end: 3, index: 0 },
          { start: 4, end: 6, index: 1 },
          { start: 7, end: 8, index: 2 },
          { start: 9, end: 11, index: 3 },
          { start: 12, end: 15, index: 4 }
      ];

      let inputSegmentToHighlight = 0;
      for (const map of inputMap) {
          if (errorIndex >= map.start && errorIndex <= map.end) {
              inputSegmentToHighlight = map.index;
              break;
          }
      }
      
      inputs[inputSegmentToHighlight].classList.add('error');
    };

    const validateCodiceFiscale = (cf) => {
      cf = cf.toUpperCase();
      if (cf.length !== 16) {
        return { isValid: false, message: 'Il Codice Fiscale deve essere di 16 caratteri.', errorIndex: 0 };
      }

      const structure = 'LLLLLLNNLNNLNNNL';
      for (let i = 0; i < 15; i++) {
        const char = cf[i];
        const expectedType = structure[i];
        const isLetter = /^[A-Z]$/.test(char);
        const isNumber = /^[0-9]$/.test(char);

        if (expectedType === 'L' && !isLetter) {
          return { isValid: false, message: `Questo carattere (${char}) dovrebbe essere una lettera.`, errorIndex: i };
        }
        if (expectedType === 'N' && !isNumber) {
          return { isValid: false, message: `Questo carattere (${char}) dovrebbe essere un numero.`, errorIndex: i };
        }
      }

      const validMonths = "ABCDEHLMPRST";
      if (validMonths.indexOf(cf[8]) === -1) {
        return { isValid: false, message: 'La lettera del mese non è valida.', errorIndex: 8 };
      }
      const day = parseInt(cf.substring(9, 11), 10);
      if (day < 1 || (day > 31 && day < 41) || day > 71) {
        return { isValid: false, message: 'Il giorno di nascita non è valido.', errorIndex: 9 };
      }

      let sum = 0;
      const oddMap = {
        '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
        'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
        'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
        'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
      };
      for (let i = 0; i < 15; i++) {
        const char = cf[i];
        if ((i + 1) % 2 === 0) {
          sum += isNaN(parseInt(char, 10)) ? char.charCodeAt(0) - 'A'.charCodeAt(0) : parseInt(char, 10);
        } else {
          sum += oddMap[char];
        }
      }
      const expectedCheckChar = String.fromCharCode('A'.charCodeAt(0) + (sum % 26));

      if (expectedCheckChar !== cf[15]) {
        return { isValid: false, message: 'Il carattere di controllo finale non è corretto.', errorIndex: 15 };
      }

      return { isValid: true, message: 'Valido', errorIndex: -1 };
    };
  });
})();
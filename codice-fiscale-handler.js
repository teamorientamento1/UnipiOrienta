(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const cfContainer = document.querySelector('.cf-container');
    if (!cfContainer) return;

    const inputs = Array.from(cfContainer.querySelectorAll('.cf-segment'));
    const hint = document.getElementById('hint-cf');

    const resetFrom = (startIndex) => {
      for (let i = startIndex; i < inputs.length; i++) {
        inputs[i].value = '';
        inputs[i].classList.add('hidden');
        inputs[i].classList.remove('error');
      }
      hint.textContent = '';
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
          // nextInput.focus(); // <-- MODIFICA: Riga rimossa
        }

        if (inputs.every(i => i.value.length === i.maxLength)) {
          validateAndHighlight();
        }
      });

      // Gestisce il tasto backspace
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
          // inputs[index - 1].focus(); // <-- MODIFICA: Riga rimossa
        }
      });
    });

    const validateAndHighlight = () => {
      inputs.forEach(input => input.classList.remove('error'));
      hint.textContent = '';
      const cf = inputs.map(input => input.value).join('').toUpperCase();
      if (cf.length !== 16) return;

      const result = validateCodiceFiscale(cf);

      if (result.isValid) {
        hint.textContent = 'Codice Fiscale formalmente valido.';
        hint.style.color = 'green';
        document.getElementById('group-nomecognome').hidden = false;
        // Rimosso il focus automatico anche qui per coerenza
        // document.getElementById('field-nome').querySelector('input').focus();
      } else {
        hint.textContent = result.message;
        hint.style.color = '#D32F2F';
        highlightErrorSegment(result.errorIndex);
      }
    };

    const highlightErrorSegment = (errorIndex) => {
      if (errorIndex === -1) return;
      let segmentIndex = 0;
      if (errorIndex <= 3) segmentIndex = 0;
      else if (errorIndex <= 6) segmentIndex = 1;
      else if (errorIndex <= 8) segmentIndex = 2;
      else if (errorIndex <= 11) segmentIndex = 3;
      else if (errorIndex <= 15) segmentIndex = 4;
      inputs[segmentIndex].classList.add('error');
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
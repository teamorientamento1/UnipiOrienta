(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const cfContainer = document.querySelector('.cf-container');
    if (!cfContainer) return;

    const fieldCf = document.getElementById('field-cf');
    const inputs = Array.from(cfContainer.querySelectorAll('.cf-segment'));
    const hint = document.getElementById('hint-cf');

    const resetFrom = (startIndex) => {
      for (let i = startIndex; i < inputs.length; i++) {
        inputs[i].value = '';
        inputs[i].classList.add('hidden');
        inputs[i].classList.remove('error');
      }
      window.Dom.clearError(fieldCf);
      hint.textContent = '';
    };

    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        // ✅ Sanificazione: permette solo lettere e numeri, e converte in maiuscolo
        const sanitizedValue = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        input.value = sanitizedValue;

        const { value, maxLength } = input;
        input.classList.remove('error');

        if (value.length === 0) {
          resetFrom(index + 1);
        }

        // ✅ Avanzamento automatico al campo successivo
        if (value.length >= maxLength && index < inputs.length - 1) {
          const nextInput = inputs[index + 1];
          nextInput.classList.remove('hidden');
          nextInput.focus();
        }

        if (inputs.every(i => i.value.length === i.maxLength)) {
          validateAndHighlight();
        } else {
          window.Dom.clearError(fieldCf);
        }
      });

      input.addEventListener('keydown', (e) => {
        // ✅ Ritorno automatico al campo precedente con Backspace
        if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    const validateAndHighlight = () => {
      inputs.forEach(input => input.classList.remove('error'));
      const cf = inputs.map(input => input.value).join('').toUpperCase();
      if (cf.length !== 16) return;

      const result = validateCodiceFiscale(cf);

      if (result.isValid) {
        window.Dom.setOk(fieldCf, 'Codice Fiscale formalmente valido.');
        document.getElementById('group-nomecognome').hidden = false;
      } else {
        window.Dom.setError(fieldCf, result.message);
        highlightErrorSegment(result.errorIndex);
      }
    };

    const highlightErrorSegment = (errorIndex) => {
      if (errorIndex === -1) return;
      
      const lengthMap = [4, 3, 2, 3, 4]; // Lunghezza di ogni segmento di input
      let cumulativeLength = 0;
      let segmentIndex = 0;

      for (let i = 0; i < lengthMap.length; i++) {
        cumulativeLength += lengthMap[i];
        if (errorIndex < cumulativeLength) {
          segmentIndex = i;
          break;
        }
      }
      inputs[segmentIndex].classList.add('error');
    };

    const validateCodiceFiscale = (cf) => {
      cf = cf.toUpperCase();
      if (cf.length !== 16) {
        return { isValid: false, message: 'Il Codice Fiscale deve essere di 16 caratteri.', errorIndex: 0 };
      }
      const structure = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}[0-9LMNPQRSTUV]{2}[A-Z]{1}[0-9LMNPQRSTUV]{3}[A-Z]{1}$/;
      if (!structure.test(cf)) {
         for (let i = 0; i < 15; i++) {
            const char = cf[i];
            const isLetter = /^[A-Z]$/.test(char);
            const isNumber = /^[0-9]$/.test(char);
            const expectedPattern = /^[A-Z]{6}[0-9]{2}[A-Z]{1}[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{1}$/;
            if (!expectedPattern.test(cf.substring(0, 15) + "A")) {
                if ((i < 6 || i === 8 || i === 11 || i === 15) && !isLetter) return { isValid: false, message: `Carattere non valido: attesa una lettera.`, errorIndex: i };
                if ((i === 6 || i === 7 || i === 9 || i === 10 || (i >= 12 && i <= 14)) && !isNumber) return { isValid: false, message: `Carattere non valido: atteso un numero.`, errorIndex: i };
            }
        }
      }
      let sum = 0;
      const oddMap = { '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21, 'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21, 'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14, 'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23 };
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
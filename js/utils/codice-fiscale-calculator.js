/**
 * codice-fiscale-calculator.js
 * Fornisce funzioni per calcolare, analizzare (parse) e generare le varianti di omocodia del Codice Fiscale.
 */
(function () {
  const VOWELS = "AEIOU";
  const MONTH_CODES = "ABCDEHLMPRST";
  
  const ODD_MAP = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
  };

  const OMOCODIA_MAP = {
    '0': 'L', '1': 'M', '2': 'N', '3': 'P', '4': 'Q', '5': 'R', '6': 'S', '7': 'T', '8': 'U', '9': 'V'
  };

  function extractChars(str) {
    const cleanStr = (str || "").toUpperCase().replace(/[^A-Z]/g, "");
    let consonants = "";
    let vowels = "";
    for (const char of cleanStr) {
      if (VOWELS.includes(char)) { vowels += char; } else { consonants += char; }
    }
    return { consonants, vowels };
  }

  function getCognomeCode(cognome) {
    const { consonants, vowels } = extractChars(cognome);
    return (consonants + vowels + "XXX").substring(0, 3);
  }

  function getNomeCode(nome) {
    const { consonants, vowels } = extractChars(nome);
    if (consonants.length >= 4) {
      return consonants[0] + consonants[2] + consonants[3];
    }
    return (consonants + vowels + "XXX").substring(0, 3);
  }

  function getDataCode(dataNascita, genere) {
    // ✅ CORREZIONE: Usa il formato corretto per moment.js (DD - MM - YYYY) per corrispondere all'output del calendario
    const formats = ['DD - MM - YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];
    const m = moment(dataNascita, formats, true);

    if (!m.isValid()) return null;

    const date = m.toDate();
    const year = date.getFullYear().toString().slice(-2);
    const month = MONTH_CODES[date.getMonth()];
    let day = date.getDate();
    if (genere.toUpperCase() === 'F') {
      day += 40;
    }
    const dayStr = day.toString().padStart(2, '0');
    return year + month + dayStr;
  }
  
  function getControlCode(cfParziale) {
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      const char = cfParziale[i];
      if ((i + 1) % 2 === 0) {
        sum += isNaN(parseInt(char, 10)) ? char.charCodeAt(0) - 'A'.charCodeAt(0) : parseInt(char, 10);
      } else {
        sum += ODD_MAP[char];
      }
    }
    return String.fromCharCode('A'.charCodeAt(0) + (sum % 26));
  }

  function calculate(data) {
    const { nome, cognome, dataNascita, genere, codiceBelfiore } = data;
    if (!nome || !cognome || !dataNascita || !genere || !codiceBelfiore) return null;
    
    const cognomeCode = getCognomeCode(cognome);
    const nomeCode = getNomeCode(nome);
    const dataCode = getDataCode(dataNascita, genere);
    
    if (!dataCode) return null;
    
    const belfioreCode = codiceBelfiore.toUpperCase();
    const cfParziale = cognomeCode + nomeCode + dataCode + belfioreCode;
    const controlCode = getControlCode(cfParziale);
    return cfParziale + controlCode;
  }
  
  function parse(cf) {
    if (!cf || cf.length !== 16) return null;
    const cfUpper = cf.toUpperCase();
    let giorno = parseInt(cfUpper.substring(9, 11), 10);
    let genere = 'M';
    if (giorno > 40) {
      giorno -= 40;
      genere = 'F';
    }
    return {
      codiceCognome: cfUpper.substring(0, 3),
      codiceNome: cfUpper.substring(3, 6),
      codiceAnno: cfUpper.substring(6, 8),
      codiceMese: cfUpper.substring(8, 9),
      codiceGiorno: cfUpper.substring(9, 11),
      giorno: giorno,
      mese: MONTH_CODES.indexOf(cfUpper.substring(8, 9)),
      genere: genere,
      codiceBelfiore: cfUpper.substring(11, 15),
    };
  }

  function generaVariazioniOmocodia(cfTeorico) {
    if (!cfTeorico || cfTeorico.length !== 16) return [];
    
    const baseCf = cfTeorico.substring(0, 15).split('');
    const numericIndices = [14, 13, 12, 10, 9, 7, 6];
    const varianti = [];

    for (const index of numericIndices) {
      const charToReplace = baseCf[index];
      if (OMOCODIA_MAP[charToReplace]) {
        let tempBase = [...baseCf];
        tempBase[index] = OMOCODIA_MAP[charToReplace];
        const newBaseString = tempBase.join('');
        const newControlChar = getControlCode(newBaseString);
        varianti.push(newBaseString + newControlChar);
      }
    }
    return varianti;
  }
  
  window.CodiceFiscaleCalculator = {
    calculate: calculate,
    parse: parse,
    generaVariazioniOmocodia: generaVariazioniOmocodia
  };

})();
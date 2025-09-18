(function(){
  const CFG = window.MASKERA_CONFIG || {
    UI: { errorClass: "error", hiddenClass: "hidden" },
    COPY: {
      required: "Questo campo è obbligatorio.",
      invalidFormat: "Il formato non è valido.",
      noSpaces: "Niente spazi in questo campo.",
      telInvalid: "Numero non valido. 9–15 cifre (ammessi + e trattini, senza spazi).",
      emailInvalid: "Indirizzo email non valido.",
      genereRequired: "Seleziona un'opzione.",
      sessoNascRequired: "Seleziona il sesso di nascita.",
      esteroRequired: "Seleziona se sei nato all'estero.",
      dsaRequired: "Seleziona un'opzione.",
      dobInvalid: "Inserisci una data valida.",
      dobFuture: "La data non può essere nel futuro.",
      ageWarnYoung: "Età molto bassa per questo form.",
      ageWarnOld: "Età più alta del previsto."
    },
    TEL_MIN_DIGITS: 9,
    TEL_MAX_DIGITS: 15,
    AGE_WARNING_MIN: 13,
    AGE_WARNING_MAX: 25
  };

  // ---------- UI helpers ----------
  function setError(el, msg){
    if(!el) return;
    const id = el.getAttribute("aria-describedby");
    if(id){
      const ids = id.split(" ");
      const errId = ids.find(x => x.includes("error"));
      if(errId){
        const errNode = document.getElementById(errId);
        if(errNode) errNode.textContent = msg || "";
      }
    }
    if(msg){ el.classList.add(CFG.UI.errorClass); el.setAttribute("aria-invalid","true"); }
    else { el.classList.remove(CFG.UI.errorClass); el.removeAttribute("aria-invalid"); }
  }

  function setWarning(el, msg){
    if(!el) return;
    const id = el.getAttribute("aria-describedby");
    if(!id) return;
    const warnId = id.split(" ").find(x => x.includes("warn"));
    if(!warnId) return;
    const warnNode = document.getElementById(warnId);
    if(warnNode) warnNode.textContent = msg || "";
  }

  const isEmpty = v => v == null || String(v).trim() === "";

  // ---------- Name / Genere / Estero ----------
  function validateName(value){
    if(isEmpty(value)) return { ok:false, msg: CFG.COPY.required };
    const v = String(value).trim();
    return v.length >= 2 ? { ok:true, value:v } : { ok:false, msg: CFG.COPY.invalidFormat };
  }

  function validateGenere(radioNodeList){
    const chosen = Array.from(radioNodeList || []).find(x => x.checked)?.value;
    return chosen ? { ok:true, value:chosen } : { ok:false, msg: CFG.COPY.genereRequired };
  }

  function validateEstero(radioNodeList){
    const chosen = Array.from(radioNodeList || []).find(x => x.checked)?.value;
    return chosen ? { ok:true, value:chosen } : { ok:false, msg: CFG.COPY.esteroRequired };
  }

  // ---------- Data di nascita ----------
  function validateDate(value){
    if(isEmpty(value)) return { ok:false, msg: CFG.COPY.dobInvalid };
    const v = String(value).trim();
    const d = new Date(v);
    if(isNaN(d.getTime())) return { ok:false, msg: CFG.COPY.dobInvalid };
    const today = new Date();
    if(d > today) return { ok:false, msg: CFG.COPY.dobFuture };
    const age = Math.floor((today - d) / (365.25*24*3600*1000));
    let warn = "";
    if(age < CFG.AGE_WARNING_MIN) warn = CFG.COPY.ageWarnYoung || "";
    else if(age > CFG.AGE_WARNING_MAX) warn = CFG.COPY.ageWarnOld || "";
    return { ok:true, value:v, warn };
  }

  // ---------- Telefono ----------
  function normalizePhone(raw){
    if(isEmpty(raw)) return "";
    let s = String(raw).trim();
    // rimuovi spazi/parentesi/punti; consenti trattini e + (solo in testa)
    s = s.replace(/[\s().]/g, "");
    s = s.replace(/\+(?=.+\+)/g, "");   // eventuali + successivi rimossi
    s = s.replace(/-+/g, "-");          // comprimi multipli trattini
    s = s.replace(/^-+/, "").replace(/-+$/, ""); // no - all'inizio/fine
    return s;
  }

  function validatePhone(value, required=true){
    if(isEmpty(value)) return required ? { ok:false, msg: CFG.COPY.required } : { ok:true, value:"" };
    let v = normalizePhone(value);
    const digits = (v.replace(/[^0-9]/g,"") || "");
    const onlyAllowed = /^\+?[0-9-]+$/.test(v) && (!v.slice(1).includes("+")); // + solo all'inizio
    const lenOk = digits.length >= (CFG.TEL_MIN_DIGITS||9) && digits.length <= (CFG.TEL_MAX_DIGITS||15);
    const ok = onlyAllowed && lenOk;
    return ok ? { ok:true, value:v } : { ok:false, msg: CFG.COPY.telInvalid };
  }

  // ---------- Email ----------
  function validateEmail(value, required=true){
    if(isEmpty(value)) return required ? { ok:false, msg: CFG.COPY.required } : { ok:true, value:"" };
    let v = String(value);
    if(/\s/.test(v)) return { ok:false, msg: CFG.COPY.noSpaces };
    v = v.trim().toLowerCase();
    const ok = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v);
    return ok ? { ok:true, value:v } : { ok:false, msg: CFG.COPY.emailInvalid };
  }

  function validateRequiredText(value){
    if(isEmpty(value)) return { ok:false, msg: CFG.COPY.required };
    const v = String(value).trim();
    return v.length >= 2 ? { ok:true, value:v } : { ok:false, msg: CFG.COPY.invalidFormat };
  }

  // ---------- Codice Fiscale (completo) ----------
  const CF_MONTHS = { A:1, B:2, C:3, D:4, E:5, H:6, L:7, M:8, P:9, R:10, S:11, T:12 };
  const OMOCODIA_MAP = { L:'0', M:'1', N:'2', P:'3', Q:'4', R:'5', S:'6', T:'7', U:'8', V:'9' };

  const CHECK_ODD = {
    '0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,
    'A':1,'B':0,'C':5,'D':7,'E':9,'F':13,'G':15,'H':17,'I':19,'J':21,
    'K':2,'L':4,'M':18,'N':20,'O':11,'P':3,'Q':6,'R':8,'S':12,'T':14,
    'U':16,'V':10,'W':22,'X':25,'Y':24,'Z':23
  };
  const CHECK_EVEN = {
    '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
    'A':0,'B':1,'C':2,'D':3,'E':4,'F':5,'G':6,'H':7,'I':8,'J':9,
    'K':10,'L':11,'M':12,'N':13,'O':14,'P':15,'Q':16,'R':17,'S':18,'T':19,
    'U':20,'V':21,'W':22,'X':23,'Y':24,'Z':25
  };

  function cfComputeCheckChar(cf15){
    let sum = 0;
    for(let i=0;i<15;i++){
      const c = cf15[i];
      const pos = i+1; // 1-based
      if(pos % 2 === 1) sum += CHECK_ODD[c] ?? 0;
      else sum += CHECK_EVEN[c] ?? 0;
    }
    const idx = sum % 26;
    return String.fromCharCode('A'.charCodeAt(0) + idx);
  }

  function cfNormalizeForCheck(cf){
    // sostituisce eventuali lettere di omocodia nelle posizioni numeriche
    const arr = cf.split("");
    const positions = [6,7,9,10,11,12,13]; // 0-based
    for(const i of positions){
      const c = arr[i];
      if(c && OMOCODIA_MAP[c]) arr[i] = OMOCODIA_MAP[c];
    }
    return arr.join("");
  }

  function cfValidateStructure(cf){
    if(!cf || typeof cf !== 'string') return { ok:false, code:"invalid_length", msg:"CF mancante." };
    const CF = cf.toUpperCase().trim();
    if(CF.length !== 16) return { ok:false, code:"invalid_length", msg:"Il CF deve avere 16 caratteri." };
    if(!/^[A-Z0-9]{16}$/.test(CF)) return { ok:false, code:"invalid_charset", msg:"Sono ammessi solo lettere e cifre." };

    const year = CF.slice(6,8);
    const month = CF[8];
    const daycode = CF.slice(9,11);
    const belf = CF.slice(11,15);
    const check = CF[15];

    const m = CF_MONTHS[month];
    if(!m) return { ok:false, code:"invalid_month", msg:"Mese non valido nel CF." };

    let day = parseInt(daycode,10);
    if(isNaN(day)) return { ok:false, code:"invalid_day", msg:"Giorno non valido nel CF." };
    let sex = 'M';
    if(day >= 41){ sex = 'F'; day = day - 40; }
    if(day < 1 || day > 31) return { ok:false, code:"invalid_day", msg:"Giorno non valido nel CF." };

    return { ok:true, parts:{ year, month: m, day, sex, belfiore:belf, check } };
  }

  function cfValidateBelfiore(cf, comuni){
    const b = cf.slice(11,15).toUpperCase();
    if(!Array.isArray(comuni) || comuni.length===0) return { ok:true, known:false }; // dataset non pronto: soft-ok
    const exists = comuni.some(c => (c.cod || c.belfiore || "").toUpperCase() === b);
    return exists ? { ok:true, known:true } : { ok:false, code:"unknown_belfiore", msg:"Codice Belfiore sconosciuto." };
  }

  function validateCodiceFiscale(value, comuni){
    const CF = (value||"").toUpperCase().trim();
    const base = cfValidateStructure(CF);
    if(!base.ok) return base;
    const cfNorm = cfNormalizeForCheck(CF);
    const expected = cfComputeCheckChar(cfNorm.slice(0,15));
    if(expected !== CF[15]){
      return { ok:false, code:"wrong_check_char", msg:"Carattere di controllo non valido." };
    }
    const bCheck = cfValidateBelfiore(CF, comuni);
    if(!bCheck.ok) return bCheck;
    return { ok:true, parts: base.parts };
  }

  window.MASKERA_VALIDATION = {
    // UI
    setError, setWarning,
    // Campi base
    validateName, validateGenere, validateEstero, validateDate,
    // Telefono/Email
    normalizePhone, validatePhone, validateEmail, validateRequiredText,
    // CF
    cfComputeCheckChar, cfNormalizeForCheck, cfValidateStructure, cfValidateBelfiore, validateCodiceFiscale
  };
})();

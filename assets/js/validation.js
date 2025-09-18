(function(){
  const CFG = window.MASKERA_CONFIG;

  function setError(el, msg){
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
    const id = el.getAttribute("aria-describedby") || "";
    const warnId = id.split(" ").find(x => x.includes("warn"));
    if(!warnId) return;
    const warnNode = document.getElementById(warnId);
    if(warnNode) warnNode.textContent = msg || "";
  }

  const isEmpty = v => !v || !String(v).trim();

  function validateName(value){
    if(isEmpty(value)) return { ok:false, msg: CFG.COPY.required };
    const v = String(value).trim();
    return v.length >= 2 ? { ok:true, value:v } : { ok:false, msg: CFG.COPY.invalidFormat };
  }
  function validateGenere(radioNodeList){
    const chosen = Array.from(radioNodeList).find(r => r.checked);
    return chosen ? { ok:true, value: chosen.value } : { ok:false, msg: CFG.COPY.genereRequired };
  }
  function validateEstero(radioNodeList){
    const chosen = Array.from(radioNodeList).find(r => r.checked);
    return chosen ? { ok:true, value: chosen.value } : { ok:false, msg: CFG.COPY.esteroRequired };
  }
  function validateDate(value){
    if(isEmpty(value)) return { ok:false, msg: CFG.COPY.required };
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return { ok:false, msg: CFG.COPY.dobInvalid };
    const today = new Date();
    if(d > today) return { ok:false, msg: CFG.COPY.dobFuture };
    const age = computeAge(d, today);
    let warn = "";
    if(age < CFG.AGE_WARNING_MIN) warn = CFG.COPY.ageWarnYoung;
    else if(age >= CFG.AGE_WARNING_MAX) warn = CFG.COPY.ageWarnOld;
    return { ok:true, value:value, warn };
  }
  function computeAge(dob, ref){
    let age = ref.getFullYear() - dob.getFullYear();
    const m = ref.getMonth() - dob.getMonth();
    if(m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age--;
    return age;
  }

  // TELEFONO: no spazi, ammessi + e trattini; 9–15 cifre totali
  function validatePhone(value, required=true){
    if(isEmpty(value)) return required ? { ok:false, msg: CFG.COPY.required } : { ok:true, value:"" };
    const v = String(value);
    if(/\s/.test(v)) return { ok:false, msg: CFG.COPY.noSpaces };
    // contiamo solo cifre per la lunghezza
    const digits = v.replace(/[^\d]/g,"");
    const ok = digits.length >= CFG.TEL_MIN_DIGITS && digits.length <= CFG.TEL_MAX_DIGITS;
    return ok ? { ok:true, value:v } : { ok:false, msg: CFG.COPY.telInvalid };
  }

  function validateEmail(value, required=true){
    if(isEmpty(value)) return required ? { ok:false, msg: CFG.COPY.required } : { ok:true, value:"" };
    let v = String(value);
    if(/\s/.test(v)) return { ok:false, msg: CFG.COPY.noSpaces };
    v = v.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v);
    return ok ? { ok:true, value:v } : { ok:false, msg: CFG.COPY.emailInvalid };
  }

  function validateRequiredText(value){
    if(isEmpty(value)) return { ok:false, msg: CFG.COPY.required };
    const v = String(value).trim();
    return v.length >= 2 ? { ok:true, value:v } : { ok:false, msg: CFG.COPY.invalidFormat };
  }

  window.MASKERA_VALIDATION = {
    setError, setWarning,
    validateName, validateGenere, validateEstero, validateDate,
    validatePhone, validateEmail, validateRequiredText
  };
})();

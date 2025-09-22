/**
 * dom.js
 * Helper DOM semplici
 */
const Dom = (() => {
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function show(el){ if(!el) return; el.hidden = false; el.classList.remove("hidden"); }
  function hide(el){ if(!el) return; el.hidden = true;  el.classList.add("hidden"); }

  function setOk(fieldEl, message) {
    if (!fieldEl) return;
    fieldEl.classList.remove("field--error");
    fieldEl.classList.add("field--ok");
    const hint = fieldEl.querySelector(".hint");
    if (hint) hint.textContent = message || "";
    fieldEl.removeAttribute("aria-invalid");
  }

  function setError(fieldEl, message){
    if(!fieldEl) return;
    fieldEl.classList.remove("field--ok");
    fieldEl.classList.add("field--error");
    const hint = fieldEl.querySelector(".hint");
    if (hint) hint.textContent = message || "";
    fieldEl.setAttribute("aria-invalid", "true");
  }

  function clearError(fieldEl){
    if(!fieldEl) return;
    fieldEl.classList.remove("field--error");
    fieldEl.classList.remove("field--ok");
    const hint = fieldEl.querySelector(".hint");
    if (hint) hint.textContent = "";
    fieldEl.removeAttribute("aria-invalid");
  }

  return { qs, qsa, show, hide, setOk, setError, clearError };
})();

window.Dom = Dom;
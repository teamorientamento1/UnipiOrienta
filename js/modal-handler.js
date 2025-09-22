(function() {
  let modal, modalTitle, modalBody, modalCloseBtn, modalProceedBtn;
  let currentCallbacks = {};

  function init() {
    modal = document.getElementById('cf-check-modal');
    if (!modal) return;
    
    modalTitle = document.getElementById('modal-title');
    modalBody = document.getElementById('modal-body');
    modalCloseBtn = document.getElementById('modal-close');
    modalProceedBtn = document.getElementById('modal-proceed');

    modalCloseBtn.addEventListener('click', () => {
      hide();
      if (currentCallbacks.onClose) {
        currentCallbacks.onClose();
      }
    });

    modalProceedBtn.addEventListener('click', () => {
      hide();
      if (currentCallbacks.onProceed) {
        currentCallbacks.onProceed();
      }
    });
  }

  function show(title, message, options = {}) {
    if (!modal) return;
    
    modalTitle.textContent = title;
    modalBody.textContent = message;
    
    modalProceedBtn.hidden = !options.showProceed;
    
    // ✅ NUOVA LOGICA: Nasconde il pulsante "Close" se `showClose` è esplicitamente false.
    // Di default, il pulsante rimane visibile per compatibilità.
    if (options.showClose === false) {
      modalCloseBtn.hidden = true;
    } else {
      modalCloseBtn.hidden = false;
      modalCloseBtn.textContent = options.closeText || "OK, ho capito";
    }
    
    currentCallbacks = {
      onClose: options.onClose,
      onProceed: options.onProceed
    };
    
    modal.classList.add('visible');
  }

  function hide() {
    if (!modal) return;
    modal.classList.remove('visible');
  }

  window.Modal = {
    init: init,
    show: show,
    hide: hide
  };
})();
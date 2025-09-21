// Questo script gestisce l'inizializzazione dei menu a tendina con ricerca (Choices.js)
document.addEventListener('DOMContentLoaded', () => {

  // Contenitore per tenere traccia delle istanze di Choices già create
  window.choicesInstances = {};

  // Configurazione standard per tutti i nostri menu con ricerca
  const choicesConfig = {
    // Traduzioni in italiano e opzioni
    noResultsText: 'Nessun risultato trovato',
    noChoicesText: 'Nessuna opzione tra cui scegliere',
    itemSelectText: 'Premi per selezionare',
    searchPlaceholderValue: 'Scrivi qui per cercare...',
    placeholder: true,
    removeItemButton: true,
    // Questa opzione è la chiave per l'opzione "Altro":
    // Permette all'utente di aggiungere un nuovo valore se non è nella lista.
    addItemText: (value) => {
      return `Premi Invio per aggiungere "<b>${value}</b>" (Altro)`;
    },
  };

  /**
   * Attiva Choices.js su un elemento <select>.
   * Se l'elemento ha già un'istanza Choices attiva, la distrugge e la ricrea.
   * Questo è FONDAMENTALE per i menu a cascata che vengono popolati dinamicamente.
   * @param {string} elementId - L'ID dell'elemento <select> da trasformare.
   */
  window.activateChoices = (elementId) => {
    // Trova l'elemento nel DOM
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Elemento con ID "${elementId}" non trovato.`);
      return;
    }

    // Se un'istanza per questo elemento esiste già, la rimuoviamo prima di ricrearla
    if (window.choicesInstances[elementId]) {
      window.choicesInstances[elementId].destroy();
    }

    // Creiamo la nuova istanza e la salviamo
    const newChoice = new Choices(element, choicesConfig);
    window.choicesInstances[elementId] = newChoice;
  };
});
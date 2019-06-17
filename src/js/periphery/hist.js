const hist = {
  init() {
    this.name = 'hist';
    return this;
  },

  bindEvents(func) {
    window.addEventListener('popstate', (event) => {
      func(event.state);
    });
  },

  receive(state) {
    if (this.isRelevant(state)) {
      window.history.pushState(state.plain, 'entry')
    }
  },

  isRelevant(state) {
    const release    = state.actionLabel === 'release' ;
    const releasePen = state.actionLabel === "releasePen";
    const go         = state.actionLabel === 'go';

    return release || releasePen || go;
  },
};

export { hist };

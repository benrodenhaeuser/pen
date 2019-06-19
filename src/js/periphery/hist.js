const hist = {
  init() {
    this.name = 'hist';
    return this;
  },

  bindEvents(func) {
    window.addEventListener('popstate', (event) => {
      if (event.state) {
        func({
          source: this.name,
          type:   'undo',
          data:   event.state,
        });
      }
    });
  },

  receive(state) {
    if (this.isRelevant(state.update)) {
      window.history.pushState(state.plain, 'entry');
    }
  },

  isRelevant(update) {
    const release    = update === 'release' ;
    const releasePen = update === "releasePen";
    const go         = update === 'go';

    return release || releasePen || go;
  },
};

export { hist };

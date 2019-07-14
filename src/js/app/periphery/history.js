const hist = {
  init() {
    this.name = 'hist';
    return this;
  },

  bindEvents(func) {
    window.addEventListener('popstate', event => {
      if (event.state) {
        func({
          source: this.name,
          type: 'switchDocument',
          data: event.state,
        });
      }
    });
  },

  react(state) {
    if (this.isRelevant(state.update)) {
      window.history.pushState(state.plain, 'entry');
    }
  },

  isRelevant(update) {
    const release = update === 'release';
    const releasePen = update === 'releasePen';
    const go = update === 'go';
    const changeMarkup = update === 'changeMarkup';

    return release || releasePen || go || changeMarkup;
  },
};

export { hist };

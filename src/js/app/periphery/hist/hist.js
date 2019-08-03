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

  react(snapshot) {
    if (this.isRelevant(snapshot.update)) {
      window.history.pushState(snapshot.plain, 'entry');
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

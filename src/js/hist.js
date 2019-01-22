const hist = {
  bindEvents(setState) {
    window.addEventListener('popstate', (event) => {
      setState(event.state);
    });
  },

  sync(state) {
    const ignoredInputs = ['docSaved'];
    if (ignoredInputs.includes(state.currentInput)) {
      return;
    }

    if (state.id !== 'idle') {
      return;
    }

    history.pushState(state, 'entry');
  },

  init() {
    this.name = 'hist';
    return this;
  }
};

export { hist };

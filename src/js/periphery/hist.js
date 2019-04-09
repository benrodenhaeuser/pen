const hist = {
  bindEvents(setState) {
    window.addEventListener('popstate', (event) => {
      setState(event.state);
    });
  },

  sync(state) {
    const ignored = [
      'docSaved', 'edit', 'createDoc', 'createShape', 'movePointer'
    ];
    const ignore  = ignored.includes(state.currentInput);
    const idle    = state.label === 'idle';
    if (ignore || !idle) {
      return;
    }

    window.history.pushState(state, 'entry');
  },

  init() {
    this.name = 'hist';
    return this;
  }
};

export { hist };

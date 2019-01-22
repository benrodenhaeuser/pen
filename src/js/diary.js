const diary = {
  bindEvents(setState) {
    window.addEventListener('popstate', (event) => {
      setState(event.state);
    });
  },

  sync(state) {
    const ignored = ['docSaved', 'edit']; // TODO: possibly others
    const ignore  = ignored.includes(state.currentInput);
    const idle    = state.id === 'idle';

    if (ignore || !idle) {
      return;
    }

    window.history.pushState(state, 'entry');
  },

  init() {
    this.name = 'diary';
    return this;
  }
};

export { diary };

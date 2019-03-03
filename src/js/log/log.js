// log is more like a 'history', so the name 'log' is quite confusing

const log = {
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
    const idle    = state.id === 'idle';
    if (ignore || !idle) {
      return;
    }

    window.history.pushState(state, 'entry');
  },

  init() {
    this.name = 'log';
    return this;
  }
};

export { log };

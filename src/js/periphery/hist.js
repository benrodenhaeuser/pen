const hist = {
  bindEvents(func) {
    window.addEventListener('popstate', (event) => {
      func(event.state);
    });
  },

  // TODO: needs finetuning
  shouldIgnore(state) {
    const ignored = [
      'docSaved', 'edit', 'createDoc', 'createShape', 'movePointer'
    ];
    const ignore  = ignored.includes(state.actionLabel);
    const idle    = state.label === 'idle';
    const pen     = state.label === 'pen' || state.label === 'continuePen';
    return ignore || !(idle || pen);
  },

  receive(state) {


    if (this.shouldIgnore(state)) {
      return;
    }

    window.history.pushState(state.plain, 'entry');
  },

  init() {
    this.name = 'hist';
    return this;
  }
};

export { hist };

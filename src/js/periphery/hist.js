const hist = {
  bindEvents(func) {
    window.addEventListener('popstate', (event) => {
      console.log('firing popstate');
      func(event.state);
    });
  },

  // TODO: needs more systematic analysis
  relevant(state) {
    const ignored = [
      'docSaved', 'edit', 'createDoc', 'createShape', 'movePointer'
    ]; // TODO: need to check this
    const ignore  = ignored.includes(state.actionLabel);
    const idle    = state.label === 'idle';
    const pen     = state.label === 'pen' || state.label === 'continuePen';
    return !ignore && (idle || pen);
  },

  receive(state) {
    if (this.relevant(state)) {
      window.history.pushState(state.plain, 'entry')
    }
  },

  init() {
    this.name = 'hist';
    return this;
  }
};

export { hist };

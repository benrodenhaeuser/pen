const timeline = {
  bindEvents(setState) {
    window.addEventListener('popstate', (event) => {
      setState(event.state);
    });
  },
 
  sync(state) {
    const ignored = ['docSaved', 'edit', 'createDoc', 'createShape'];
    const ignore  = ignored.includes(state.currentInput);
    const idle    = state.id === 'idle';
    if (ignore || !idle) { return; }

    window.history.pushState(state, 'entry');
  },

  init() {
    this.name = 'timeline';
    return this;
  }
};

export { timeline };

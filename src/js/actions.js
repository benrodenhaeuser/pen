const actions = {
  skip() {
    return;
  },

  clear(state, event) {
    state.aux = {};
  },

  createShape(state, event) {
    state.doc.appendShape();
  },

  createProject(state, event) {
    state.doc.init();
  },

  setFrameOrigin(state, event) {
    state.doc.insertFrameInPlace();
    state.aux.originX = event.clientX;
    state.aux.originY = event.clientY;
  },

  grabCorner(state, event) {
    const frame = state.doc.selected.frame;

    // store coordinates of opposite corner
    // to the one that was clicked:
    switch (event.target.dataset.corner) {
      case 'top-left':
        state.aux.originX = frame.left + frame.width;
        state.aux.originY = frame.top + frame.height;
        break;
      case 'top-right':
        state.aux.originX = frame.left;
        state.aux.originY = frame.top + frame.height;
        break;
      case 'bottom-right':
        state.aux.originX = frame.left;
        state.aux.originY = frame.top;
        break;
      case 'bottom-left':
        state.aux.originX = frame.left + frame.width;
        state.aux.originY = frame.top;
        break;
    }
  },

  sizeFrame(state, event) {
    state.doc.selected.frame.set({
      top:    Math.min(state.aux.originY, event.clientY),
      left:   Math.min(state.aux.originX, event.clientX),
      width:  Math.abs(state.aux.originX - event.clientX),
      height: Math.abs(state.aux.originY - event.clientY),
    });
  },

  deleteFrame(state, event) {
    event.preventDefault();
    state.doc.deleteSelectedFrame();
  },

  grabFrame(state, event) {
    const id = event.target.dataset.id;
    state.doc.selected.frame = state.doc.selectFrame(id);

    state.aux.originX = event.clientX;
    state.aux.originY = event.clientY;
  },

  moveFrame(state, event) {
    const frame = state.doc.selected.frame;

    frame.set({
      top:  frame.top  + (event.clientY - state.aux.originY),
      left: frame.left + (event.clientX - state.aux.originX),
    });

    state.aux.originX = event.clientX;
    state.aux.originY = event.clientY;
  },

  processProjectIds(state, event) {
    // TODO: implement
    // event.detail holds the response.
    // need to add the array with project ids to state
  },
};

export { actions };

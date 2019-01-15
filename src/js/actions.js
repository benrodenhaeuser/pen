const actions = {
  skip() {
    return;
  },

  clear(state, input) {
    state.aux = {};
  },

  createShape(state, input) {
    state.doc.appendShape();
  },

  createProject(state, input) {
    state.doc.init();
  },

  setFrameOrigin(state, input) {
    state.doc.insertFrameInPlace();
    state.aux.originX = input.detail.inputX;
    state.aux.originY = input.detail.inputY;
  },

  grabCorner(state, input) {
    const frame = state.doc.selected.frame;

    // store coordinates of *opposite* corner
    switch (input.detail.target) {
      case 'top-left-corner':
        state.aux.originX = frame.left + frame.width;
        state.aux.originY = frame.top + frame.height;
        break;
      case 'top-right-corner':
        state.aux.originX = frame.left;
        state.aux.originY = frame.top + frame.height;
        break;
      case 'bot-right-corner':
        state.aux.originX = frame.left;
        state.aux.originY = frame.top;
        break;
      case 'bot-left-corner':
        state.aux.originX = frame.left + frame.width;
        state.aux.originY = frame.top;
        break;
    }
  },

  sizeFrame(state, input) {
    state.doc.selected.frame.set({
      top:    Math.min(state.aux.originY, input.detail.inputY),
      left:   Math.min(state.aux.originX, input.detail.inputX),
      width:  Math.abs(state.aux.originX - input.detail.inputX),
      height: Math.abs(state.aux.originY - input.detail.inputY),
    });
  },

  deleteFrame(state, input) {
    state.doc.deleteSelectedFrame();
  },

  grabFrame(state, input) {
    const id = input.detail.id;
    state.doc.selected.frame = state.doc.selectFrameAndShape(id);

    state.aux.originX = input.detail.inputX;
    state.aux.originY = input.detail.inputY;
  },

  moveFrame(state, input) {
    const frame = state.doc.selected.frame;

    frame.set({
      top:  frame.top  + (input.detail.inputY - state.aux.originY),
      left: frame.left + (input.detail.inputX - state.aux.originX),
    });

    state.aux.originX = input.detail.inputX;
    state.aux.originY = input.detail.inputY;
  },

  processProjectIds(state, input) {
    state.docIds = input.detail.docIds;
  },
};

export { actions };

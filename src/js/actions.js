const actions = {
  createShape(state, input) {
    state.doc.appendShape();
  },

  createDoc(state, input) {
    state.doc.init();
    state.docs.ids.push(state.doc._id);
    state.docs.selected = state.doc._id;
  },

  setFrameOrigin(state, input) {
    state.doc.insertFrameInPlace();
    this.aux.originX = input.data.inputX;
    this.aux.originY = input.data.inputY;
  },

  resizeFrame(state, input) {
    const frame = state.doc.selected.frame;

    switch (input.data.target) {
      case 'top-left-corner':
        this.aux.originX = frame.left + frame.width;
        this.aux.originY = frame.top + frame.height;
        break;
      case 'top-right-corner':
        this.aux.originX = frame.left;
        this.aux.originY = frame.top + frame.height;
        break;
      case 'bot-right-corner':
        this.aux.originX = frame.left;
        this.aux.originY = frame.top;
        break;
      case 'bot-left-corner':
        this.aux.originX = frame.left + frame.width;
        this.aux.originY = frame.top;
        break;
    }
  },

  sizeFrame(state, input) {
    state.doc.selected.frame.set({
      top:    Math.min(this.aux.originY, input.data.inputY),
      left:   Math.min(this.aux.originX, input.data.inputX),
      width:  Math.abs(this.aux.originX - input.data.inputX),
      height: Math.abs(this.aux.originY - input.data.inputY),
    });
  },

  clean(state, input) {
    // TODO: not sure if this is needed.?
    const same = (val1, val2) => {
      const treshold = 1;
      return Math.abs(val1 - val2) <= treshold;
    };

    const sameX = same(this.aux.originX, input.data.inputX);
    const sameY = same(this.aux.originY, input.data.inputY);

    if (sameX && sameY) {
      state.doc.deleteSelectedFrame();
    }
  },

  deleteFrame(state, input) {
    state.doc.deleteSelectedFrame();
  },

  getFrameOrigin(state, input) {
    state.doc.select(input.data.id);
    this.aux.originX = input.data.inputX;
    this.aux.originY = input.data.inputY;
  },

  moveFrame(state, input) {
    const frame = state.doc.selected.frame;

    frame.set({
      top:  frame.top  + (input.data.inputY - this.aux.originY),
      left: frame.left + (input.data.inputX - this.aux.originX),
    });

    this.aux.originX = input.data.inputX;
    this.aux.originY = input.data.inputY;
  },

  updateDocList(state, input) {
    state.docs.ids = input.data.docIDs;
  },

  requestDoc(state, input) {
    state.docs.selected = input.data.id;
  },

  setDoc(state, input) {
    state.doc.init(input.data.doc);
  },

  init() {
    this.aux = {};
  },
};

export { actions };

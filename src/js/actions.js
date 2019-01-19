const actions = {
  createShape(state, input) {
    state.doc.appendShape();
  },

  createDoc(state, input) {
    state.doc.init();
    state.docIds.push(state.doc._id);
  },

  setFrameOrigin(state, input) {
    state.doc.insertFrameInPlace();
    this.aux.originX = input.detail.inputX;
    this.aux.originY = input.detail.inputY;
  },

  resizeFrame(state, input) {
    const frame = state.doc.selected.frame;

    switch (input.detail.target) {
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
      top:    Math.min(this.aux.originY, input.detail.inputY),
      left:   Math.min(this.aux.originX, input.detail.inputX),
      width:  Math.abs(this.aux.originX - input.detail.inputX),
      height: Math.abs(this.aux.originY - input.detail.inputY),
    });
  },

  clean(state, input) {
    // TODO: not sure if this is needed.
    const same = (val1, val2) => {
      const treshold = 1;
      // console.log(Math.abs(val1 - val2));
      return Math.abs(val1 - val2) <= treshold;
    };

    const sameX = same(this.aux.originX, input.detail.inputX);
    const sameY = same(this.aux.originY, input.detail.inputY);

    if (sameX && sameY) {
      state.doc.deleteSelectedFrame();
    }
  },

  deleteFrame(state, input) {
    state.doc.deleteSelectedFrame();
  },

  getFrameOrigin(state, input) {
    state.doc.select(input.detail.id);
    this.aux.originX = input.detail.inputX;
    this.aux.originY = input.detail.inputY;
  },

  moveFrame(state, input) {
    const frame = state.doc.selected.frame;

    frame.set({
      top:  frame.top  + (input.detail.inputY - this.aux.originY),
      left: frame.left + (input.detail.inputX - this.aux.originX),
    });

    this.aux.originX = input.detail.inputX;
    this.aux.originY = input.detail.inputY;
  },

  updateDocList(state, input) {
    state.docIds = input.detail.docIds;
  },

  requestDoc(state, input) {
    state.docId = input.detail.id;
  },

  setDoc(state, input) {
    state.doc.init(input.detail.doc);
  },

  init() {
    this.aux = {};
  }
};

export { actions };

const actions = {
  skip() {
    return;
  },

  clear() {
    this.aux = {};
  },

  createShape(state, input) {
    state.doc.appendShape();
  },

  createProject(state, input) {
    state.doc.init();
  },

  setFrameOrigin(state, input) {
    state.doc.insertFrameInPlace();
    this.aux.originX = input.detail.inputX;
    this.aux.originY = input.detail.inputY;
  },

  grabCorner(state, input) {
    const frame = state.doc.selected.frame;

    // store coordinates of *opposite* corner
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

  deleteFrame(state, input) {
    state.doc.deleteSelectedFrame();
  },

  grabFrame(state, input) {
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

  processProjectIds(state, input) {
    state.docIds = input.detail.docIds;
  },

  loadDoc(state, input) {
    state.docId = input.detail.id;
    console.log("doc id is" + state.docId);
  },

  setDoc(state, input) {
    state.doc.init(input.detail.doc);
  },



  init() {
    this.aux = {};
  }
};

export { actions };

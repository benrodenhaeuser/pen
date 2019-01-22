const transformers = {
  createShape(state, input) {
    state.doc.appendShape();
  },

  createDoc(state, input) {
    state.doc.init();
    state.docs.ids.push(state.doc._id);
    state.docs.selectedID = state.doc._id;
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
      this.aux.originX = frame.x + frame.w;
      this.aux.originY = frame.y + frame.h;
      break;
    case 'top-right-corner':
      this.aux.originX = frame.x;
      this.aux.originY = frame.y + frame.h;
      break;
    case 'bot-right-corner':
      this.aux.originX = frame.x;
      this.aux.originY = frame.y;
      break;
    case 'bot-left-corner':
      this.aux.originX = frame.x + frame.w;
      this.aux.originY = frame.y;
      break;
    }
  },

  sizeFrame(state, input) {
    state.doc.selected.frame.set({
      y: Math.min(this.aux.originY, input.data.inputY),
      x: Math.min(this.aux.originX, input.data.inputX),
      w: Math.abs(this.aux.originX - input.data.inputX),
      h: Math.abs(this.aux.originY - input.data.inputY),
    });
  },

  clean(state, input) {
    // TODO: not sure if this is needed?
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
      y: frame.y  + (input.data.inputY - this.aux.originY),
      x: frame.x + (input.data.inputX - this.aux.originX),
    });

    this.aux.originX = input.data.inputX;
    this.aux.originY = input.data.inputY;
  },

  updateDocList(state, input) {
    state.docs.ids = input.data.docIDs;
  },

  requestDoc(state, input) {
    state.docs.selectedID = input.data.id;
  },

  setDoc(state, input) {
    state.doc.init(input.data.doc);
  },

  getStartAngle(state, input) {
    const frame = state.doc.select(input.data.id);

    const centerX = frame.x + frame.w / 2;
    const centerY = frame.y + frame.h / 2;
    const startX  = input.data.inputX - centerX;
    const startY  = input.data.inputY - centerY;

    this.aux.centerX = centerX;
    this.aux.centerY = centerY;
    this.aux.startAngle = Math.atan2(startY, startX);
    this.aux.frameStartAngle = frame.r;
  },

  rotateFrame(state, input) {
    const frame = state.doc.selected.frame;

    const currentX = input.data.inputX - this.aux.centerX;
    const currentY = input.data.inputY - this.aux.centerY;

    const currentAngle = Math.atan2(currentY, currentX);
    const startAngle = this.aux.startAngle;

    frame.set({ r: currentAngle - startAngle + this.aux.frameStartAngle });
  },

  init() {
    this.aux = {};
  },
};

export { transformers };

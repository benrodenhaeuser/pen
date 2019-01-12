const actions = {
  skip() {
    return;
  },

  clear() {
    this.aux = {};
  },

  createShape(event) {
    this.model.appendShape();
  },

  createProject(event) {
    this.model.init();
  },

  setFrameOrigin(event) {
    this.model.insertFrameInPlace();
    this.aux.originX = event.clientX;
    this.aux.originY = event.clientY;
  },

  grabCorner(event) {
    const frame = this.model.selected.frame;

    // store coordinates of opposite corner
    switch (event.target.dataset.corner) {
      case 'top-left':
        this.aux.originX = frame.left + frame.width;
        this.aux.originY = frame.top + frame.height;
        break;
      case 'top-right':
        this.aux.originX = frame.left;
        this.aux.originY = frame.top + frame.height;
        break;
      case 'bottom-right':
        this.aux.originX = frame.left;
        this.aux.originY = frame.top;
        break;
      case 'bottom-left':
        this.aux.originX = frame.left + frame.width;
        this.aux.originY = frame.top;
        break;
    }
  },

  sizeFrame(event) {
    this.model.selected.frame.set({
      top:    Math.min(this.aux.originY, event.clientY),
      left:   Math.min(this.aux.originX, event.clientX),
      width:  Math.abs(this.aux.originX - event.clientX),
      height: Math.abs(this.aux.originY - event.clientY),
    });
  },

  deleteFrame(event) {
    event.preventDefault(); // => it's an anchor!
    this.model.deleteSelectedFrame();
  },

  grabFrame(event) {
    const id = event.target.dataset.id;
    console.log('id', id);
    this.model.selected.frame = this.model.selectFrame(id);
    console.log('this.model.selected.frame', this.model.selected.frame);

    this.aux.originX = event.clientX;
    this.aux.originY = event.clientY;
  },

  moveFrame(event) {
    const frame = this.model.selected.frame;

    frame.set({
      top:  frame.top  + (event.clientY - this.aux.originY),
      left: frame.left + (event.clientX - this.aux.originX),
    });

    this.aux.originX = event.clientX;
    this.aux.originY = event.clientY;
  },

  init(model) {
    this.model = model;
    this.aux = {};
    return this;
  },
};

export { actions };

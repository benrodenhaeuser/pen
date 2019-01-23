const transformers = {
  createShape(state, input) {
    state.doc.appendShape();
  },

  createDoc(state, input) {
    state.doc.init();
    state.docs.ids.push(state.doc._id);
    state.docs.selectedID = state.doc._id;
  },

  deleteFrame(state, input) {
    state.doc.deleteSelectedFrame();
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

  setFrameOrigin(state, input) {
    state.doc.insertFrameInPlace();
    this.aux.originX = input.data.inputX;
    this.aux.originY = input.data.inputY;
  },

  findOppCorner(state, input) {
    const frame = state.doc.selected.frame;

    let opp;

    switch (input.data.target) {
    case 'top-left-corner':
      opp = [frame.x + frame.width, frame.y + frame.height]; // bottom right
      break;
    case 'top-right-corner':
      opp = [frame.x, frame.y + frame.height];               // bottom left
      break;
    case 'bot-right-corner':
      opp = [frame.x, frame.y];                              // top left
      break;
    case 'bot-left-corner':
      opp = [frame.x + frame.width, frame.y];                // top right
      break;
    }

    // store opposite corner
    [this.aux.oppX, this.aux.oppY] = opp;
    // store centre of frame
    this.aux.center = [frame.x + frame.width / 2, frame.y + frame.height / 2];
  },

  // rotate point around center by angle radians
  rotate(point, center, angle) {
    const [pointX,  pointY ] = point;
    const [centerX, centerY] = center;
    const cos                = Math.cos(angle);
    const sin                = Math.sin(angle);

    return [
      cos * (pointX - centerX) - sin * (pointY - centerY) + centerX,
      sin * (pointX - centerX) + cos * (pointY - centerY) + centerY
    ];
  },

  resizeFrame(state, input) {
    const frame          = state.doc.selected.frame;

    // rotate stored opposite corner
    const angle          = frame.angle;
    const opp            = [this.aux.oppX, this.aux.oppY];
    const [oppX, oppY]   = opp;
    const oppRotated     = this.rotate(opp, this.aux.center, angle);
    const [oppXr, oppYr] = oppRotated;

    // use rotated opposite corner to unrotate mouse position
    const cornerRotated        = [input.data.inputX, input.data.inputY];
    const [cornerXr, cornerYr] = cornerRotated;
    const newCenter            = [(cornerXr + oppXr)/2, (cornerYr + oppYr)/2];
    const [newCenterX, newCenterY] = newCenter;
    const corner               = this.rotate(cornerRotated, newCenter, -angle);
    const [cornerX, cornerY]   = corner;

    // use corner and newCenter to find width and height
    const width  = 2 * Math.abs(cornerX - newCenterX);
    const height = 2 * Math.abs(cornerY - newCenterY);
    // => seems right.

    // find new opposite corner (unrotated)
    const newOpp = [
      newCenterX + (newCenterX - cornerX),
      newCenterY + (newCenterY - cornerY)
    ];

    // store new opposite corner (unrotated) and new center
    const [newOppX, newOppY] = newOpp;
    [this.aux.oppX, this.aux.oppY] = newOpp;
    this.aux.center = newCenter;

    state.doc.selected.frame.set({
      x:      Math.min(newOppX, cornerX),
      y:      Math.min(newOppY, cornerY),
      width:  width,
      height: height,
    });
  },

  sizeFrame(state, input) {
    state.doc.selected.frame.set({
      x:      Math.min(this.aux.originX, input.data.inputX),
      y:      Math.min(this.aux.originY, input.data.inputY),
      width:  Math.abs(this.aux.originX - input.data.inputX),
      height: Math.abs(this.aux.originY - input.data.inputY),
    });
  },

  releaseFrame(state, input) {
    const frame = state.doc.selected.frame;
    console.log('x: ' + String(frame.x), 'y: ' + String(frame.y));
  },

  clean(state, input) {
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

  getStartAngle(state, input) {
    const frame              = state.doc.select(input.data.id);
    this.aux.centerX         = frame.x + frame.width / 2;
    this.aux.centerY         = frame.y + frame.height / 2;
    const startX             = input.data.inputX - this.aux.centerX;
    const startY             = input.data.inputY - this.aux.centerY;
    this.aux.startAngle      = Math.atan2(startY, startX);
    this.aux.frameStartAngle = frame.angle;
  },

  rotateFrame(state, input) {
    const frame        = state.doc.selected.frame;
    const currentX     = input.data.inputX - this.aux.centerX;
    const currentY     = input.data.inputY - this.aux.centerY;
    const currentAngle = Math.atan2(currentY, currentX);
    const angleToAdd   = currentAngle - this.aux.startAngle;

    frame.set({ angle: this.aux.frameStartAngle + angleToAdd });
  },

  init() {
    this.aux = {};
  },
};

export { transformers };

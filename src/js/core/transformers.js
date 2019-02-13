import { Matrix } from './matrix.js';

let aux = {};

const transformers = {

  // NEW

  select(state, input) {
    const selected = state.doc.scene
      .findDescendant((node) => {
        return node._id === input.pointer.targetID;
      })
      .findAncestor((node) => {
        return node.props.class.includes('frontier');
      });

    selected ? selected.select() : state.doc.scene.deselectAll();

    aux.sourceX = input.pointer.x;
    aux.sourceY = input.pointer.y;
    aux.ctm = selected.getCTM();
    aux.inv = selected.getCTM().invert();
  },

  initRotate(state, input) {
    aux.sourceX = input.pointer.x;
    aux.sourceY = input.pointer.y;

    const selected = state.doc.scene.selected;
    const coords = selected.coords;
    const centerX = coords.x + coords.width / 2;   // untransformed
    const centerY = coords.y + coords.height / 2;  // untransformed

    const column = Object.create(Matrix).init([[centerX], [centerY], [1]]);
    const transformed = selected.getCTM().multiply(column).toArray();
    // ^ idea: apply ctm to center to obtain "current center"

    aux.centerX = transformed[0][0];
    aux.centerY = transformed[1][0];
    aux.ctm = selected.getCTM();
    aux.inv = selected.getCTM().invert();
  },

  rotate(state, input) {
    const selected     = state.doc.scene.selected;
    const targetX      = input.pointer.x;
    const targetY      = input.pointer.y;
    const sourceVector = [aux.sourceX - aux.centerX, aux.sourceY - aux.centerY];
    const targetVector = [targetX - aux.centerX, targetY - aux.centerY];
    const sourceAngle  = Math.atan2(...sourceVector);
    const targetAngle  = Math.atan2(...targetVector);
    const angle        = sourceAngle - targetAngle;
    const rotation     = Matrix.rotation(angle, [aux.centerX, aux.centerY]);
    const ctm          = selected.getCTM();
    const inverse      = ctm.invert();
    const matrix       = aux.inv.multiply(rotation).multiply(aux.ctm);

    // notice that we just use the rotation matrix below:
    selected.props.transform = rotation.multiply(selected.props.transform);

    aux.sourceX = targetX;
    aux.sourceY = targetY;
  },

  shift(state, input) {
    const selected = state.doc.scene.selected;

    if (!selected) {
      return;
    }

    const targetX  = input.pointer.x;
    const targetY  = input.pointer.y;
    const vectorX  = targetX - aux.sourceX;
    const vectorY  = targetY - aux.sourceY;
    const shift    = Matrix.translation(vectorX, vectorY);
    const ctm      = selected.getCTM();
    const inverse  = ctm.invert();
    const matrix   = aux.inv.multiply(shift).multiply(aux.ctm);

    // notice that we just use the shift matrix below:
    selected.props.transform = shift.multiply(selected.props.transform);

    aux.sourceX = targetX;
    aux.sourceY = targetY;
  },

  release(state, input) {
    aux = {};
  },

  selectThrough(state, input) {
    const target = state.doc.scene.findDescendant((node) => {
      return node._id === input.pointer.targetID;
    });

    const selection = target.findAncestor((node) => {
      return node.parent && node.parent.props.class.includes('frontier');
    });

    if (selection) {
      selection.select();
      state.doc.scene.setFrontier();
      state.doc.scene.unfocus();
    }
  },

  focus(state, input) {
    const target = state.doc.scene.findDescendant((node) => {
      return node._id === input.pointer.targetID;
    });

    if (target) {
      const highlight = target.findAncestor((node) => {
        return node.props.class.includes('frontier');
      });

      if (highlight) {
        highlight.props.class.add('focus');
      } else {
        state.doc.scene.unfocus();
      }
    }
  },

  // OLD

  createShape(state, input) {
    state.doc.appendShape();

    input.pointerData.target // 'wrapper'
    input.pointerData.targetID // our id ...
    input.pointerData.x  // x coord with offset
    input.pointerData.y  // y coord with offset

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
    state.docs.selectedID = input.pointer.targetID;
  },

  setDoc(state, input) {
    state.doc.init(input.data.doc);
  },

  setFrameOrigin(state, input) { // don't have it
    state.doc.insertFrameInPlace();
    this.aux.originX = input.pointer.x;
    this.aux.originY = input.pointer.y;
  },

  findOppCorner(state, input) {
    // purpose was to find the fixed point of resizing
    // but we don't do that.
    const frame = state.doc.selected.frame;

    let opp;

    switch (input.pointer.target) {
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
  // rotate(point, center, angle) {
  //   const [pointX,  pointY ] = point;
  //   const [centerX, centerY] = center;
  //   const cos                = Math.cos(angle);
  //   const sin                = Math.sin(angle);
  //
  //   return [
  //     cos * (pointX - centerX) - sin * (pointY - centerY) + centerX,
  //     sin * (pointX - centerX) + cos * (pointY - centerY) + centerY
  //   ];
  // },

  resizeFrame(state, input) { // becomes scale transform - different!
    const frame = state.doc.selected.frame;
    const shape = state.doc.selected.shape;

    // rotate stored opposite corner
    const angle = frame.angle;
    const opp = [this.aux.oppX, this.aux.oppY];
    const [oppX, oppY] = opp;
    const oppRotated = this.rotate(opp, this.aux.center, angle);
    const [oppXr, oppYr] = oppRotated;

    // use rotated opposite corner to unrotate mouse position
    const cornerRotated = [input.pointer.x, input.pointer.y];
    const [cornerXr, cornerYr] = cornerRotated;
    const newCenter = [(cornerXr + oppXr)/2, (cornerYr + oppYr)/2];
    const [newCenterX, newCenterY] = newCenter;
    const corner = this.rotate(cornerRotated, newCenter, -angle);
    const [cornerX, cornerY] = corner;

    // use corner/newCenter to find new opposite corner
    const newOpp = [
      newCenterX + (newCenterX - cornerX),
      newCenterY + (newCenterY - cornerY)
    ];

    // store new opposite corner (unrotated) and new center
    const [newOppX, newOppY] = newOpp;
    [this.aux.oppX, this.aux.oppY] = newOpp;
    this.aux.center = newCenter;

    const newWidth  = Math.abs(newOppX - cornerX);
    const newHeight = newWidth / shape.aspectRatio;

    // mutate frame state
    state.doc.selected.frame.set({
      x:      Math.min(newOppX, cornerX),
      y:      Math.min(newOppY, cornerY),
      width:  newWidth,
      height: newHeight,
    });
  },

  sizeFrame(state, input) { // part of creating a frame: we don't do that
    const shape     = state.doc.selected.shape;
    const newWidth  = Math.abs(this.aux.originX - input.pointer.x);
    const newHeight = newWidth / shape.aspectRatio;

    state.doc.selected.frame.set({
      x:      Math.min(this.aux.originX, input.pointer.x),
      y:      Math.min(this.aux.originY, input.pointer.y),
      width:  newWidth,
      height: newHeight,
    });
  },

  // releaseFrame(state, input) {
  //   const frame = state.doc.selected.frame;
  // },

  clean(state, input) {
    const same = (val1, val2) => {
      const treshold = 1;
      return Math.abs(val1 - val2) <= treshold;
    };

    const sameX = same(this.aux.originX, input.pointer.x);
    const sameY = same(this.aux.originY, input.pointer.y);

    if (sameX && sameY) {
      state.doc.deleteSelectedFrame();
    }
  },

  getFrameOrigin(state, input) {
    state.doc.select(input.pointer.targetID);
    this.aux.originX = input.pointer.x;
    this.aux.originY = input.pointer.y;
  },

  moveFrame(state, input) {
    const frame = state.doc.selected.frame;

    frame.set({
      y: frame.y  + (input.pointer.y - this.aux.originY),
      x: frame.x + (input.pointer.x - this.aux.originX),
    });

    this.aux.originX = input.pointer.x;
    this.aux.originY = input.pointer.y;
  },

  getStartAngle(state, input) {
    const frame              = state.doc.select(input.pointer.targetID);
    this.aux.centerX         = frame.x + frame.width / 2;
    this.aux.centerY         = frame.y + frame.height / 2;
    const startX             = input.pointer.x - this.aux.centerX;
    const startY             = input.pointer.y - this.aux.centerY;
    this.aux.startAngle      = Math.atan2(startY, startX);
    this.aux.frameStartAngle = frame.angle;
  },

  rotateFrame(state, input) { // don't really need that?
    const frame        = state.doc.selected.frame;
    const currentX     = input.pointer.x - this.aux.centerX;
    const currentY     = input.pointer.y - this.aux.centerY;
    const currentAngle = Math.atan2(currentY, currentX);
    const angleToAdd   = currentAngle - this.aux.startAngle;

    frame.set({ angle: this.aux.frameStartAngle + angleToAdd });
  },

  init() {
    this.aux = {};
  },
};

export { transformers };

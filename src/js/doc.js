const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};

const Frame = {
  set(data) {
    this.x = data.x || this.x;
    this.y = data.y || this.y;
    this.w = data.w || this.w;
    this.h = data.h || this.h;
  },

  init(data) {
    this._id = data._id || createID();
    this.x   = data.x   || 0;
    this.y   = data.y   || 0;
    this.w   = data.w   || 0;
    this.h   = data.h   || 0;

    return this;
  },
};

const doc = {
  findIndexOf(selectedFrame) {
    const frames = doc.selected.shape.frames;
    for (let i = 0; i < frames.length; i += 1) {
      if (frames[i] === selectedFrame) {
        return i;
      }
    }
  },

  appendShape() {
    const shape = {
      _id: createID(),
      frames: [],
    };
    this.shapes.push(shape);
    this.selected.shape = shape;
    this.selected.frame = null;
  },

  insertFrameInPlace(data = {}) {
    const frame  = Object.create(Frame).init(data);
    const frames = this.selected.shape.frames;

    if (this.selected.frame) {
      const index = this.findIndexOf(this.selected.frame);
      frames.splice(index + 1, 0, frame);
    } else {
      frames.push(frame);
    }

    this.selected.frame = frame;
    return frame;
  },

  deleteSelectedFrame() {
    const frames = this.selected.shape.frames;
    const index = this.findIndexOf(this.selected.frame);
    frames.splice(index, 1);

    if (frames[index - 1] !== undefined) {
      this.selected.frame = frames[index - 1];
    } else if (frames[index] !== undefined) {
      this.selected.frame = frames[index];
    } else {
      this.selected.frame = null;
    }
  },

  select(frameID) {
    for (let shape of this.shapes) {
      for (let frame of shape.frames) {
        if (frame._id === frameID) {
          this.selected.frame = frame;
          this.selected.shape = shape;
          return frame;
        }
      }
    }
  },

  findFrame(id) {
    for (let shape of this.shapes) {
      for (let frame of shape.frames) {
        if (frame._id === id) {
          return frame;
        }
      }
    }
  },

  findShape(id) {
    for (let shape of this.shapes) {
      if (shape._id === id) {
        return shape;
      }
    }
  },

  toJSON() {
    return {
      _id: this._id,
      shapes: this.shapes,
      selected: {
        frameID: this.selected.frame && this.selected.frame._id || null,
        shapeID: this.selected.shape._id,
      },
    };
  },

  initFromDocData(docData) {
    for (let shape of docData.shapes) {
      shape.frames = shape.frames.map((frame) => {
        return Object.create(Frame).init(frame);
      });
    }

    this._id            = docData._id;
    this.shapes         = docData.shapes;
    this.selected.shape = this.findShape(docData.selected.shapeID);
    this.selected.frame = this.findFrame(docData.selected.frameID);
  },

  init(docData) {
    if (docData !== undefined) {
      this.initFromDocData(docData);
      return this;
    }

    const docID   = createID();
    const shapeID = createID();
    const shape   = {
      _id: shapeID,
      frames: [],
    };
    this._id      = docID;
    this.shapes   = [shape];
    this.selected = {
      shape: shape,
      frame: null,
    };

    return this;
  },
};

export { doc };

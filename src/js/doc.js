import { createId } from './utils.js'

const Frame = {
  get coordinates() {
    return {
      top:    this.top,
      left:   this.left,
      width:  this.width,
      height: this.height,
    };
  },

  set(coordinates) {
    this.left   = coordinates.left || this.left;
    this.top    = coordinates.top || this.top;
    this.width  = coordinates.width || this.width;
    this.height = coordinates.height || this.height;
  },

  init(coordinates) {
    this.left   = coordinates.left || 0;
    this.top    = coordinates.top || 0;
    this.width  = coordinates.width || 0;
    this.height = coordinates.height || 0;
    this._id    = createId();
    return this;
  },
};

const findIndexOf = function(selectedFrame) {
  const frames = doc.selected.shape.frames;
  for (let i = 0; i < frames.length; i += 1) {
    if (frames[i] === selectedFrame) {
      return i;
    }
  }
};

const doc = {
  appendShape() {
    const shape = {
      _id: createId(),
      frames: [],
    };
    this.shapes.push(shape);
    this.selected.shape = shape;
    this.selected.frame = null;
  },

  insertFrameInPlace(coordinates = {}) {
    const frame  = Object.create(Frame).init(coordinates);
    const frames = this.selected.shape.frames;

    if (this.selected.frame) {
      const index = findIndexOf(this.selected.frame);
      frames.splice(index + 1, 0, frame);
    } else {
      frames.push(frame);
    }

    this.selected.frame = frame;
  },

  deleteSelectedFrame() {
    const frames = this.selected.shape.frames;
    const index = findIndexOf(this.selected.frame);
    frames.splice(index, 1);

    if (frames[index] !== undefined) {
      this.selected.frame = frames[index];
    } else if (frames[index - 1] !== undefined) {
      this.selected.frame = frames[index - 1];
    } else {
      this.selected.frame = null;
    }
  },

  selectFrameAndShape(frameId) {
    for (let shape of this.shapes) {
      for (let frame of shape.frames) {
        if (frame._id === frameId) {
          this.selected.frame = frame;
          this.selected.shape = shape;
          return frame; // TODO: unexpected given method name
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

  empty() {
    const docId = createId();
    const shapeId = createId();
    const shape = {
      _id: shapeId,
      frames: [],
    };

    this._id = docId;
    this.shapes = [shape];
    this.selected = {
      shape: shape,
      frame: null,
    };
  },

  import(docData) {
    // TODO
  },

  init(docData) {
    if (docData === undefined) {
      this.empty();
    } else {
      this.import(docData);
    }

    return this;
  },
};

export { doc };

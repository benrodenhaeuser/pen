import { getNextId } from './utils.js'

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
    this.id     = getNextId();
    return this;
  },
};

const findIndexOf = function(selectedFrame) {
  const frames = model.selected.shape.frames;
  for (let i = 0; i < frames.length; i += 1) {
    if (frames[i] === selectedFrame) {
      return i;
    }
  }
};

const model = {
  get data() {
    return {
      shapes: this.shapes,
      selected: this.selected,
    };
  },

  appendShape() {
    const shape = {
      id: getNextId(),
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

  selectFrame(id) {
    for (let shape of this.shapes) {
      for (let frame of shape.frames) {
        if (frame.id === id) {
          this.selected.frame = frame;
          this.selected.shape = shape;
          return frame;
        }
      }
    }
  },

  setupShapes(data) {
    this.shapes = [];

    for (let shapeData of data) {
      let frames = [];
      this.shapes.push({
        id: getNextId(),
        frames: frames
      });
      for (let frameData of shapeData) {
        let frame = Object.create(Frame).init(frameData);
        frames.push(frame);
      }
    }

    const lastShape = this.shapes[this.shapes.length - 1];
    const lastFrame = lastShape.frames[lastShape.frames.length - 1];

    this.selected = {
      shape: lastShape,
      frame: lastFrame,
    };
  },

  init(json) {
      // case where we did not get data:

      // const shape = {
      //   id: getNextId(),
      //   frames: [],
      // };
      //
      // this.shapes = [shape];
      //
      // this.selected = {
      //   shape: shape,
      //   frame: null,
      // };

    this.setupShapes(JSON.parse(json));
    return this;
  },
};

export { model };

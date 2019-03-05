import { Vector } from './vector.js';

const Rectangle = {
  // => two vectors (origin, size)
  create(origin = Vector.create(), size = Vector.create()) {
    return Object.create(Rectangle).init(origin, size);
  },

  init(origin, size) {
    this.origin = origin;
    this.size = size;

    return this;
  },

  // => 4 integers
  createFromDimensions(x, y, width, height) {
    const origin = Vector.create(x, y);
    const size   = Vector.create(width, height);

    return Rectangle.create(origin, size);
  },

  // => two vectors (from, to)
  createFromMinMax(min, max) {
    const origin = Vector.create(min.x, min.y);
    const size   = Vector.create(max.x - min.x, max.y - min.y);

    return Rectangle.create(origin, size);
  },

  get min() {
    return this.origin;
  },

  get max() {
    return Vector.create(this.origin.x + this.size.x, this.origin.y + this.size.y);
  },

  get x() {
    return this.origin.x;
  },

  get y() {
    return this.origin.y;
  },

  get width() {
    return this.size.x;
  },

  get height() {
    return this.size.y;
  },

  get corners() {
    return [
      this.min,                                                               // NW
      Vector.create(this.origin.x + this.size.x, this.origin.y),              // NE
      Vector.create(this.origin.x, this.origin.y + this.size.y),              // SW
      this.max                                                                // SE
    ];
  },

  // smallest rectangle enclosing this and other
  getBoundingRect(other) {
    let min = Vector.create();
    let max = Vector.create();

    min.x = Math.min(this.min.x, other.min.x);
    min.y = Math.min(this.min.y, other.min.y);
    max.x = Math.max(this.max.x, other.max.x);
    max.y = Math.max(this.max.y, other.max.y);

    return Rectangle.createFromMinMax(min, max);
  },

  toJSON() {
    return {
      x:      this.origin.x,
      y:      this.origin.y,
      width:  this.size.x,
      height: this.size.y,
    };
  },
};

export { Rectangle };
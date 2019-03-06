import { Vector } from './vector.js';

const Rectangle = {
  // => two vectors (origin and size)
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

  // => two vectors (from and to, or equivalently, min and max)
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
      this.min,                                                  // nw
      Vector.create(this.origin.x + this.size.x, this.origin.y), // ne
      Vector.create(this.origin.x, this.origin.y + this.size.y), // sw
      this.max                                                   // se
    ];
  },

  get center() {
    return Vector.create(this.x + this.width / 2, this.y + this.height / 2);
  },

  // smallest rectangle enclosing `this` and `other`
  getBoundingRect(other) {
    let min = Vector.create();
    let max = Vector.create();

    min.x = Math.min(this.min.x, other.min.x);
    min.y = Math.min(this.min.y, other.min.y);
    max.x = Math.max(this.max.x, other.max.x);
    max.y = Math.max(this.max.y, other.max.y);

    return Rectangle.createFromMinMax(min, max);
  },

  toString() {
    return [
      this.origin.x,
      this.origin.y,
      this.size.x,
      this.size.y,
    ].join(' ');
  },

  toJSON() {
    return {
      x: this.origin.x,
      y: this.origin.y,
      width: this.size.x,
      height: this.size.y,
    };
  },
};

export { Rectangle };

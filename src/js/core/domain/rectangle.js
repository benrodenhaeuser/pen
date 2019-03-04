import { Vector } from './vector.js';

const Rectangle = {
  create(origin = Vector.create(), size = Vector.create()) {
    return Object.create(Rectangle).init(origin, size);
  },

  init(origin, size) {
    this.origin = origin;
    this.size = size;

    return this;
  },

  createFromDimensions(x, y, width, height) {
    const origin = Vector.create(x, y);
    const size   = Vector.create(width, height);

    return Rectangle.create(origin, size);
  },

  createFromMinMax(min, max) {
    const origin = Vector.create(min.x, min.y);
    const size   = Vector.create(max.x - min.x, max.y - min.y);

    return Rectangle.create(origin, size);
  },

  // TODO: better to call on rect1 for consistency?
  getBoundingRect(rect1, rect2) {
    let min = Vector.create();
    let max = Vector.create();

    min.x = Math.min(rect1.min().x, rect2.min().x);
    min.y = Math.min(rect1.min().y, rect2.min().y);
    max.x = Math.max(rect1.max().x, rect2.max().x);
    max.y = Math.max(rect1.max().y, rect2.max().y);

    return Rectangle.createFromMinMax(min, max);
  },

  min() {
    return Vector.create(this.origin.x, this.origin.y);
  },

  max() {
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

  corners() {
    return [
      this.origin, // NW
      Vector.create(this.origin.x + this.size.x, this.origin.y), // NE
      Vector.create(this.origin.x, this.origin.y + this.size.y), // SW
      Vector.create(this.origin.x + this.size.x, this.origin.y + this.size.y) // SE
    ];
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

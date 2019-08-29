import { Matrix } from './_.js';
import * as vec2 from '/vendor/glmatrix/vec2.js';

const Vector = {
  create(x = 0, y = 0) {
    return Object.create(Vector).init(x, y);
  },

  createFromObject(obj) {
    return Object.create(Vector).init(obj.x, obj.y);
  },

  init(x, y) {
    this.x = x;
    this.y = y;
    return this;
  },

  coords() {
    return { x: this.x, y: this.y };
  },

  // return value: new Vector instance
  transform(matrix) {
    const out = vec2.create();
    vec2.transformMat2d(out, this.toArray(), matrix.m);
    return Vector.create(...out);
  },

  transformToLocal(shape) {
    return this.transform(shape.globalTransform().invert());
  },

  // return value: new Vector instance
  rotate(angle, vector) {
    return this.transform(Matrix.rotation(angle, vector));
  },

  // return value: new Vector instance
  add(other) {
    return Vector.create(this.x + other.x, this.y + other.y);
  },

  // return value: new Vector instance
  minus(other) {
    return Vector.create(this.x - other.x, this.y - other.y);
  },

  // return value: new Vector instance
  abs() {
    return Vector.create(Math.abs(this.x), Math.abs(this.y));
  },

  // return value: boolean
  isWithin(rectangle) {
    return (
      this.x >= rectangle.x &&
      this.x <= rectangle.x + rectangle.width &&
      this.y >= rectangle.y &&
      this.y <= rectangle.y + rectangle.height
    );
  },

  // return value: number
  angle(...args) {
    if (args.length === 0) {
      return Math.atan2(this.y, this.x);
    } else {
      const [from, to] = args;
      return to.minus(this).angle() - from.minus(this).angle();
    }
  },

  length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  },

  toArray() {
    return [this.x, this.y];
  },

  toString() {
    // TODO: rounding (extract precision to constant)
    // see http://www.jacklmoore.com/notes/rounding-in-javascript/
    const x = Number(Math.round(this.x + 'e3') + 'e-3');
    const y = Number(Math.round(this.y + 'e3') + 'e-3');

    return `${x} ${y}`;
  },
};

export { Vector };

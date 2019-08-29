import { Vector } from './_.js';
import * as mat2d from '/vendor/glmatrix/mat2d.js';

const Matrix = {
  create(m) {
    return Object.create(Matrix).init(m);
  },

  init(m) {
    this.m = m;
    return this;
  },

  createFromDOMMatrix($matrix) {
    const m = [
      $matrix.a,
      $matrix.b,
      $matrix.c,
      $matrix.d,
      $matrix.e,
      $matrix.f,
    ];

    return Matrix.create(m);
  },

  equals(other) {
    for (let i = 0; i <= 5; i += 1) {
      if (this.m[i] !== other.m[i]) {
        return false;
      }
    }

    return true;
  },

  toJSON() {
    return this.toArray();
  },

  toString() {
    // TODO: rounding, extract precision to constant
    const m = Array.from(this.m).map(value =>
      Number(Math.round(value + 'e3') + 'e-3')
    );

    return `matrix(${m.join(', ')})`;
  },

  toArray() {
    return Array.from(this.m);
  },

  multiply(other) {
    const m = mat2d.create();
    mat2d.multiply(m, this.m, other.m);
    return Matrix.create(m);
  },

  invert() {
    const m = mat2d.create();
    mat2d.invert(m, this.m);
    return Matrix.create(m);
  },

  identity() {
    const m = [1, 0, 0, 1, 0, 0];
    return Matrix.create(m);
  },

  rotation(angle, origin) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const m = [
      cos,
      sin,
      -sin,
      cos,
      -origin.x * cos + origin.y * sin + origin.x,
      -origin.x * sin - origin.y * cos + origin.y,
    ];

    return Matrix.create(m);
  },

  translation(vector) {
    const m = [1, 0, 0, 1, vector.x, vector.y];

    return Matrix.create(m);
  },

  scale(factor, origin = Vector.create(0, 0)) {
    const m = [
      factor,
      0,
      0,
      factor,
      origin.x - factor * origin.x,
      origin.y - factor * origin.y,
    ];

    return Matrix.create(m);
  },
};

export { Matrix };

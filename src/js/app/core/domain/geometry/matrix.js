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
      [$matrix.a, $matrix.c, $matrix.e],
      [$matrix.b, $matrix.d, $matrix.f],
      [0, 0, 1],
    ];

    return Matrix.create(m);
  },

  equals(other) {
    for (let i = 0; i <= 2; i += 1) {
      for (let j = 0; j <= 2; j += 1) {
        if (this.m[i][j] !== other.m[i][j]) {
          return false;
        }
      }
    }

    return true;
  },

  toJSON() {
    return this.m;
  },

  // return value: string
  toString() {
    const sixValueMatrix = [
      this.m[0][0],
      this.m[1][0],
      this.m[0][1],
      this.m[1][1],
      this.m[0][2],
      this.m[1][2],
    ];

    return `matrix(${sixValueMatrix.join(', ')})`;
  },

  // return value: Array
  toArray() {
    return this.m;
  },

  // return value: new Matrix instance
  multiply(other) {
    const m1 = [
      this.m[0][0],
      this.m[1][0],
      this.m[0][1],
      this.m[1][1],
      this.m[0][2],
      this.m[1][2],
    ];
    const m2 = [
      other.m[0][0],
      other.m[1][0],
      other.m[0][1],
      other.m[1][1],
      other.m[0][2],
      other.m[1][2],
    ];

    const out = mat2d.create();

    mat2d.multiply(out, m1, m2);

    return Matrix.create([
      [out[0], out[2], out[4]],
      [out[1], out[3], out[5]],
      [0, 0, 1],
    ]);
  },

  // return value: new Matrix instance
  invert() {
    const inp = [
      this.m[0][0],
      this.m[1][0],
      this.m[0][1],
      this.m[1][1],
      this.m[0][2],
      this.m[1][2],
    ];

    const out = mat2d.create();

    mat2d.invert(out, inp);

    return Matrix.create([
      [out[0], out[2], out[4]],
      [out[1], out[3], out[5]],
      [0, 0, 1],
    ]);
  },

  // return value: new Matrix instance
  identity() {
    const m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    return Matrix.create(m);
  },

  // return value: new Matrix instance
  rotation(angle, origin) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const m = [
      [cos, -sin, -origin.x * cos + origin.y * sin + origin.x],
      [sin, cos, -origin.x * sin - origin.y * cos + origin.y],
      [0, 0, 1],
    ];

    return Matrix.create(m);
  },

  // return value: new Matrix instance
  translation(vector) {
    const m = [[1, 0, vector.x], [0, 1, vector.y], [0, 0, 1]];

    return Matrix.create(m);
  },

  // return value: new Matrix instance
  scale(factor, origin = Vector.create(0, 0)) {
    const m = [
      [factor, 0, origin.x - factor * origin.x],
      [0, factor, origin.y - factor * origin.y],
      [0, 0, 1],
    ];

    return Matrix.create(m);
  },
};

export { Matrix };

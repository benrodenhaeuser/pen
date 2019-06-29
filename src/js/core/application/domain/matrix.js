import { Vector } from './vector.js';
import * as mat2d from '/vendor/glmatrix/mat2d.js';
import * as vec2  from '/vendor/glmatrix/vec2.js';

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
      [0,         0,         1        ]
    ];

    return Matrix.create(m);
  },

  toJSON() {
    return this.m;
  },

  // return value: string
  toString() {
    const sixValueMatrix = [
      this.m[0][0], this.m[1][0], this.m[0][1], this.m[1][1], this.m[0][2], this.m[1][2]
    ];

    return `matrix(${sixValueMatrix.join(', ')})`;
  },

  // return value: Array
  toArray() {
    return this.m;
  },

  // return value: new Matrix instance // TODO
  multiply(other) {
    const m1 = [...this.m[0], ...this.m[1]];
    const m2 = [...other.m[0], ...other.m[1]];

    const m = [];

    mat2d.multiply(m, m1, m2);

    const out = [
      [m[0], m[1], m[2]],
      [m[3], m[4], m[5]],
      [0, 0, 1]
    ];

    return Matrix.create(out);
  },

  // return value: new Matrix instance // TODO
  invert() {
    const m1 = [...this.m[0], ...this.m[1]];

    const m = [];

    mat2d.invert(m, m1);

    return Matrix.create([
      [m[0], m[1], m[2]],
      [m[3], m[4], m[5]],
      [0, 0, 1]
    ]);
  },

  // return value: new Matrix instance
  identity() {
    const m = JSON.parse(JSON.stringify(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]
    ));

    return Matrix.create(m);
  },

  // return value: new Matrix instance
  rotation(angle, origin) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const m = [
      [cos, -sin, -origin.x * cos + origin.y * sin + origin.x],
      [sin,  cos, -origin.x * sin - origin.y * cos + origin.y],
      [0,    0,    1                                         ]
    ];

    return Matrix.create(m);
  },

  // return value: new Matrix instance
  translation(vector) {
    const m = [
      [1, 0, vector.x],
      [0, 1, vector.y],
      [0, 0, 1       ]
    ];

    return Matrix.create(m);
  },

  // return value: new Matrix instance
  scale(factor, origin = Vector.create(0, 0)) {
    const m = [
      [factor, 0,      origin.x - factor * origin.x],
      [0,      factor, origin.y - factor * origin.y],
      [0,      0,      1                           ]
    ];

    return Matrix.create(m);
  },
};

export { Matrix };

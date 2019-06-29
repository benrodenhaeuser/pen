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
    const m =
      [
        $matrix.a, $matrix.c, $matrix.e,
        $matrix.b, $matrix.d, $matrix.f
      ]
    ;

    // is this the right order? I think so.

    return Matrix.create(m);
  },

  toJSON() {
    return this.m;
  },

  // return value: string
  toString() {
    console.log('calling toString on matrix'); // never called? why?

    const m = [
      this.m[0], this.m[3], this.m[1], this.m[4], this.m[2], this.m[5];
    ]
    // right order? I think so.

    return `matrix(${m.join(', ')})`;
  },

  // return value: new Vector instance
  transform(vector) {
    const out = vec2.create();
    vec2.transformMat2d(out, vector.toArray(), this.m);
    return Vector.create(...out);
  },

  // return value: Array
  toArray() {
    return this.m;
  },

  // return value: new Matrix instance
  multiply(other) {
    const m = mat2d.create();
    mat2d.multiply(m, this.m, other.m);
    return Matrix.create(m);
  },

  // return value: new Matrix instance
  invert() {
    const m = mat2d.create();
    mat2d.invert(m, this.m);
    return Matrix.create(m);
  },

  // return value: new Matrix instance (this is a "class method")
  identity() {
    const m = [
      1, 0, 0,
      0, 1, 0
    ];

    return Matrix.create(mat2d.create());
  },

  // return value: new Matrix instance (this is a "class method")
  rotation(angle, origin) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const m = [
      cos, -sin, -origin.x * cos + origin.y * sin + origin.x,
      sin,  cos, -origin.x * sin - origin.y * cos + origin.y
    ];

    return Matrix.create(m);
  },

  // return value: new Matrix instance (this is a "class method")
  translation(vector) {
    const m = [
      1, 0, vector.x,
      0, 1, vector.y
    ];

    return Matrix.create(m);
  },

  // return value: new Matrix instance (this is a "class method")
  scale(factor, origin = Vector.create(0, 0)) {
    const m = [
      factor, 0,      origin.x - factor * origin.x,
      0,      factor, origin.y - factor * origin.y
    ];

    return Matrix.create(m);
  },
};

export { Matrix };

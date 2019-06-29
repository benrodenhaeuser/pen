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
      [$matrix.a, $matrix.b, $matrix.c, $matrix.d, $matrix.e, $matrix.f]
    ;

    return Matrix.create(m);
  },

  toJSON() {
    return this.m;
  },

  // return value: string
  toString() {
    return `matrix(${this.m.join(', ')})`;
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

  // return value: new Matrix instance
  identity() {
    return Matrix.create(mat2d.create());
  },

  // return value: new Matrix instance
  rotation(angle, origin) {
    const m = mat2d.create();
    mat2d.rotate(m, this.m, angle.toArray(), );
    return Matrix.create(m);
  },

  // return value: new Matrix instance
  translation(vector) {
    const m = mat2d.create();
    mat2d.translate(m, this.m, vector.toArray());
    return Matrix.create(m);
  },

  // return value: new Matrix instance
  scale(factor, origin = Vector.create(0, 0)) {
    const m = mat2d.create();
    mat2d.scale(m, this.m, origin.toArray());
    return Matrix.create(m);
  },
};

export { Matrix };

// rotation around origin with given angle:
// translate rotate translate (?)

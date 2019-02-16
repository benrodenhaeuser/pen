import { Matrix } from './matrix.js';

const Vector = {
  create(x, y) {
    return Object.create(Vector).init(x, y);
  },

  init(x, y) {
    this.x = x;
    this.y = y;
    return this;
  },

  transform(matrix) {
    const column      = Matrix.create([[this.x], [this.y], [1]]);
    const transformed = matrix.multiply(column).toArray();

    return Vector.create(transformed[0][0], transformed[1][0]);
  },

  add(other) {
    return Vector.create(this.x + other.x, this.y + other.y);
  },

  subtract(other) {
    return Vector.create(this.x - other.x, this.y - other.y);
  }
};

export { Vector };

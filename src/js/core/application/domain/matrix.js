import { Vector   } from './vector.js';

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
      this.m[0][0].toFixed(3), this.m[1][0].toFixed(3),
      this.m[0][1].toFixed(3), this.m[1][1].toFixed(3),
      this.m[0][2].toFixed(3), this.m[1][2].toFixed(3)
    ];

    return `matrix(${sixValueMatrix.join(', ')})`;
  },

  // return value: new Vector instance
  transform(vector) {
    const column      = Matrix.create([[vector.x], [vector.y], [1]]);
    const transformed = this.multiply(column).toArray();

    return Vector.create(transformed[0][0], transformed[1][0]);
  },

  // return value: Array
  toArray() {
    return this.m;
  },

  // return value: new Matrix instance
  multiply(other) {
    const m = math.multiply(this.m, other.m);
    return Matrix.create(m);
  },

  // return value: new Matrix instance
  invert() {
    const m = JSON.parse(JSON.stringify(this.m));
    return Matrix.create(math.inv(m));
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
    const sin                = Math.sin(angle);
    const cos                = Math.cos(angle);

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

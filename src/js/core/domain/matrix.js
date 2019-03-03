import { Vector } from './vector.js';

// TODO: put in a utility module somewhere
const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};

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
    return this.toAttributeString();
  },

  toAttributeString() {
    return `matrix(${this.toVector()})`;
  },

  toVector() {
    return [
      this.m[0][0], this.m[1][0], this.m[0][1],
      this.m[1][1], this.m[0][2], this.m[1][2]
    ];
  },

  transform(vector) {
    const column      = Matrix.create([[vector.x], [vector.y], [1]]);
    const transformed = this.multiply(column).toArray();

    return Vector.create(transformed[0][0], transformed[1][0]);
  },

  toArray() {
    return this.m;
  },

  multiply(other) {
    const m = math.multiply(this.m, other.m);
    return Matrix.create(m);
  },

  invert() {
    const m = JSON.parse(JSON.stringify(this.m));
    return Matrix.create(math.inv(m));
  },

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

  translation(vector) {
    const m = [
      [1, 0, vector.x],
      [0, 1, vector.y],
      [0, 0, 1       ]
    ];

    return Matrix.create(m);
  },

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

const Matrix = {

  // create/initialize

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

  // typecasting

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

  toArray() {
    return this.m;
  },

  // operations on matrices

  multiply(other) {
    const m = math.multiply(this.m, other.m);
    return Matrix.create(m);
  },

  invert() {
    const m = JSON.parse(JSON.stringify(this.m));
    return Matrix.create(math.inv(m));
  },

  // special 3x3 matrices

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
    const [originX, originY] = origin;
    const sin                = Math.sin(angle);
    const cos                = Math.cos(angle);

    const m = [
      [cos, -sin, -originX * cos + originY * sin + originX],
      [sin,  cos, -originX * sin - originY * cos + originY],
      [0,    0,    1                                      ]
    ];

    return Matrix.create(m);
  },

  translation(...vector) {
    const [vectorX, vectorY] = vector;

    const m = [
      [1, 0, vectorX],
      [0, 1, vectorY],
      [0, 0, 1      ]
    ];

    return Matrix.create(m);
  },

  scale(factor, origin = [0, 0]) {
    const [originX, originY] = origin;

    const m = [
      [factor, 0,      originX - factor * originX],
      [0,      factor, originY - factor * originY],
      [0,      0,      1                         ]
    ];

    return Matrix.create(m);
  },
};

export { Matrix };

const Matrix = {
  multiply(other) {
    const thisRows  = this.m.length;
    const thisCols  = this.m[0].length;
    const otherRows = other.m.length;
    const otherCols = other.m[0].length;
    const m         = new Array(thisRows);

    for (let r = 0; r < thisRows; r += 1) {
      m[r] = new Array(otherCols);

      for (let c = 0; c < otherCols; c += 1) {
        m[r][c] = 0;

        for (let i = 0; i < thisCols; i += 1) {
          m[r][c] += this.m[r][i] * other.m[i][c];
        }
      }
    }

    return Object.create(Matrix).init(m);
  },

  invert() {
    const m = JSON.parse(JSON.stringify(this.m));
    return Object.create(Matrix).init(math.inv(m));
  },

  identity() {
    const m = JSON.parse(JSON.stringify(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]
    ));

    return Object.create(Matrix).init(m);
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

    return Object.create(Matrix).init(m);
  },

  translation(...vector) {
    const [vectorX, vectorY] = vector;

    const m = [
      [1, 0, vectorX],
      [0, 1, vectorY],
      [0, 0, 1      ]
    ];

    return Object.create(Matrix).init(m);
  },

  scale(factor, origin) {
    const [originX, originY] = origin;

    const m = [
      [factor, 0,      originX - factor * originX],
      [0,      factor, originY - factor * originY],
      [0,      0,      1                         ]
    ];

    return Object.create(Matrix).init(m);
  },

  // TODO: not general enough
  toVector() {
    return [
      this.m[0][0], this.m[1][0], this.m[0][1],
      this.m[1][1], this.m[0][2], this.m[1][2]
    ];
  },

  toArray() {
    return this.m;
  },

  fromDOMMatrix($matrix) {
    this.m = [
      [$matrix.a, $matrix.c, $matrix.e],
      [$matrix.b, $matrix.d, $matrix.f],
      [0,         0,         1        ]
    ];

    return this;
  },

  toJSON() {
    return this.toAttributeString();
  },

  toAttributeString() {
    return `matrix(${this.toVector()})`;
  },

  init(m) {
    this.m = m;
    return this;
  },
};

export { Matrix };

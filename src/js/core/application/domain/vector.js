const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};

const Vector = {
  create(x = 0, y = 0) {
    return Object.create(Vector).init(x, y).addID();
  },

  init(x, y) {
    this.x = x;
    this.y = y;
    return this;
  },

  addID() {
    this._id = createID();
    return this;
  },

  coords() {
    return { x: this.x, y: this.y };
  },

  transform(matrix) {
    return matrix.transform(this);
  },

  add(other) {
    return Vector.create(this.x + other.x, this.y + other.y);
  },

  minus(other) {
    return Vector.create(this.x - other.x, this.y - other.y);
  },

  abs() {
    return Vector.create(Math.abs(this.x), Math.abs(this.y));
  },

  isWithin(rectangle) {
    return this.x >= rectangle.x &&
           this.x <= rectangle.x + rectangle.width &&
           this.y >= rectangle.y &&
           this.y <= rectangle.y + rectangle.height;
  },

  angle(...args) {
    if (args.length === 0) {
      return Math.atan2(this.y, this.x);
    } else {
      const [from, to] = args;
      return to.minus(this).angle() - from.minus(this).angle();
    }
  },

  length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  },
};

export { Vector };
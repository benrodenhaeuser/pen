const Vector = {
  create(x = 0, y = 0) {
    return Object.create(Vector).init(x, y);
  },

  createWithID(x,y) {
    return Vector.create(x, y).addID();
  },

  init(x, y) {
    this.x = x;
    this.y = y;
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

  subtract(other) {
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

  addID() {
    this._id = createID();
    return this;
  },
};

export { Vector };
const Segment = {
  create(vectors = {}) {
    return Object.create(Segment).init(vectors);
  },

  init(vectors) {
    this.anchor    = vectors.anchor;
    this.handleIn  = vectors.handleIn;
    this.handleOut = vectors.handleOut;

    return this;
  },
};

export { Segment };

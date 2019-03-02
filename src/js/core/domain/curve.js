const Curve = {
  createFromSegments(segment1, segment2) {
    return Object.create(Curve).init(segment1, segment2);
  },

  init(segment1, segment2) {
    this.anchor1 = segment1.anchor;
    this.anchor2 = segment2.anchor;
    this.handle1 = segment1.handleOut;
    this.handle2 = segment2.handleOut;
  },
};

export { Curve };

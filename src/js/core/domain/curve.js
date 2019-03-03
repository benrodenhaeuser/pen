import { Bezier } from '../../ext/bezier.js';

const Curve = {
  create(anchor1, anchor2, handle1, handle2) {
    return Object.create(Curve).init(anchor1, anchor2, handle1, handle2);
  },

  createFromSegments(segment1, segment2) {
    return Curve.create(
      segment1.anchor,
      segment2.anchor,
      segment1.handleOut,
      segment2.handleIn
    );
  },

  init(anchor1, anchor2, handle1, handle2) {
    this.anchor1 = anchor1;
    this.anchor2 = anchor2;
    this.handle1 = handle1;
    this.handle2 = handle2;

    return this;
  },

  points() {
    return [this.anchor1, this.anchor2, this.handle1, this.handle2]
      .filter((point) => {
        return (point !== undefined);
      });
  },

  coords() {
    return this.points().map(point => point.coords());
  },

  isLine() {
    return (this.handle1 === undefined) && (this.handle2 === undefined);
  },

  isQuadratic() {
    return (this.handle1 !== undefined) && (this.handle2 === undefined);
  },

  isCubic() {
    return (this.handle1 !== undefined) && (this.handle2 !== undefined);
  },

  // TODO: we would prefer a rectangle here, I think, rather than what Bezier.js returns
  bBox() {
    if (this.isLine()) {
      return;
    }

    // Taking advantage of the Bezier.js library:
    return new Bezier(...this.coords()).bbox();

  },
};

export { Curve };

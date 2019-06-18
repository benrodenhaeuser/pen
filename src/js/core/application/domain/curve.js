import { Rectangle } from './rectangle.js';
import { Vector    } from './vector.js';
import { Bezier    } from './bezier/bezier.js';

const Curve = {
  // the params are Vector instances
  create(anchor1, anchor2, handle1, handle2) {
    return Object.create(Curve).init(anchor1, anchor2, handle1, handle2);
  },

  // the params are Segment instances
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

  // NOTE: the order of points is crucial. It is required
  // by the Bezier constructor of the Pomax Bezier library!
  points() {
    const pts = [this.anchor1, this.handle1, this.handle2, this.anchor2]
      .filter((point) => {
        return (point !== undefined && point !== null);
      });

    return pts;
  },

  coords() {
    const cds = this.points().map(point => point.coords());
    return cds;
  },

  isLine() {
    return (this.handle1 === undefined || this.handle1 === null) && (this.handle2 === undefined || this.handle1 === null);
  },

  isQuadratic() {
    return (this.handle1 !== undefined || this.handle1 === null) && (this.handle2 === undefined || this.handle1 === null);
  },

  isCubic() {
    return (this.handle1 !== undefined || this.handle1 === null) && (this.handle2 !== undefined || this.handle1 === null);
  },

  get bounds() {
    let min, max;

    if (this.isLine()) {
      const minX = Math.min(this.anchor1.x, this.anchor2.x);
      const minY = Math.min(this.anchor1.y, this.anchor2.y);
      const maxX = Math.max(this.anchor1.x, this.anchor2.x);
      const maxY = Math.max(this.anchor1.y, this.anchor2.y);

      min  = Vector.create(minX, minY);
      max  = Vector.create(maxX, maxY);
    } else {
      const bbox = new Bezier(...this.coords()).bbox();

      min = Vector.create(bbox.x.min, bbox.y.min);
      max = Vector.create(bbox.x.max, bbox.y.max);
    }

    return Rectangle.createFromMinMax(min, max);
  },
};

export { Curve };

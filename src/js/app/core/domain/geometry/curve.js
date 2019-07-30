import { Bezier } from '/vendor/bezier/bezier.js';
import { Rectangle } from './dir.js';
import { Vector } from './dir.js';

const Curve = {
  // the params are Vector instances
  create(anchor1, anchor2, handle1, handle2) {
    return Object.create(Curve).init(anchor1, anchor2, handle1, handle2);
  },

  // TODO: this assumes cubic coordinates
  // coords is an array of points of the form { x: .., y: ...}
  createFromCoordinates(coords) {
    return Curve.create(
      Vector.create(coords[0]),
      Vector.create(coords[1]),
      Vector.create(coords[2]),
      Vector.create(coords[3])
    );
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
  // It is also the order in which points occur in a path string.
  points() {
    const pts = [this.anchor1, this.handle1, this.handle2, this.anchor2].filter(
      point => {
        return point !== undefined && point !== null;
      }
    );

    return pts;
  },

  coords() {
    const cds = this.points().map(point => point.coords());
    return cds;
  },

  toPathString() {
    const a1 = this.anchor1 && this.anchor1.toString();
    const a2 = this.anchor2 && this.anchor2.toString();
    const h1 = this.handle1 && this.handle1.toString();
    const h2 = this.handle2 && this.handle2.toString();

    if (this.isDegenerate()) {
      return `M ${a1}`;
    } else if (this.isLine()) {
      return `M ${a1} L ${a2}`;
    } else if (this.isQuadratic()) {
      return `M ${a1} Q ${h1 || h2} ${a2}`;
    } else if (this.isCubic()) {
      return `M ${a1} C ${h1} ${h2} ${a2}`;
    }
  },

  isInvalid() {
    return this.hasNoAnchor();
  },

  isDegenerate() {
    return this.hasOneAnchor();
  },

  isLine() {
    return this.hasTwoAnchors() && this.hasNoHandle();
  },

  isQuadratic() {
    return this.hasTwoAnchors() && this.hasOneHandle();
  },

  isCubic() {
    return this.hasTwoAnchors() && this.hasTwoHandles();
  },

  hasAnchor() {
    return this.anchor1 || this.anchor2;
  },

  hasHandle() {
    return this.handle1 || this.handle2;
  },

  hasTwoAnchors() {
    return this.anchor1 && this.anchor2;
  },

  hasTwoHandles() {
    return this.handle1 && this.handle2;
  },

  hasOneAnchor() {
    return this.hasAnchor() && !this.hasTwoAnchors();
  },

  hasOneHandle() {
    return this.hasHandle() && !this.hasTwoHandles();
  },

  hasNoAnchor() {
    return !this.hasAnchor();
  },

  hasNoHandle() {
    return !this.hasHandle();
  },

  get bounds() {
    let min, max;

    if (this.isLine()) {
      const minX = Math.min(this.anchor1.x, this.anchor2.x);
      const minY = Math.min(this.anchor1.y, this.anchor2.y);
      const maxX = Math.max(this.anchor1.x, this.anchor2.x);
      const maxY = Math.max(this.anchor1.y, this.anchor2.y);

      min = Vector.create(minX, minY);
      max = Vector.create(maxX, maxY);
    } else {
      const bbox = new Bezier(...this.coords()).bbox();

      min = Vector.create(bbox.x.min, bbox.y.min);
      max = Vector.create(bbox.x.max, bbox.y.max);
    }

    return Rectangle.createFromMinMax(min, max);
  },
};

export { Curve };

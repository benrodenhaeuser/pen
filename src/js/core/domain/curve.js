import { Rectangle } from './rectangle.js';
import { Vector }    from './vector.js';
import { Bezier }    from '../../ext/bezier/bezier.js';

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

  bBox() {
    if (this.isLine()) {
      const minX = Math.min(this.anchor1.x, this.anchor2.x);
      const minY = Math.min(this.anchor1.y, this.anchor2.y);
      const maxX = Math.max(this.anchor1.x, this.anchor2.x);
      const maxY = Math.max(this.anchor1.y, this.anchor2.y);
      const min  = Vector.create(minX, minY);
      const max  = Vector.create(maxX, maxY);

      console.log(Rectangle.createFromMinMax(min, max));

      return Rectangle.createFromMinMax(min, max);
    }

    const box = new Bezier(...this.coords()).bbox();
    const min = Vector.create(box.x.min, box.y.min);
    const max = Vector.create(box.x.max, box.y.max);

    return Rectangle.createFromMinMax(min, max);
  },
};

export { Curve };

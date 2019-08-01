import { SceneNode } from './_.js';
import { Segment } from './_.js';
import { Rectangle } from '../geometry/_.js';
import { Curve } from '../geometry/_.js';

const Spline = Object.create(SceneNode);
Spline.type = 'spline';

Object.assign(Spline, {
  appendSegment() {
    const segment = Segment.create();
    this.append(segment);
    return segment;
  },

  curves() {
    const theCurves = [];

    // this conditional creates a degenerate curve if
    // there is exactly 1 segment in the spline
    if (this.children.length === 1) {
      const start = this.children[0]; 
      const end = Segment.create();

      theCurves.push(Curve.createFromSegments(start, end));
    }

    // if spline has exactly 1 segment, no curves will be
    // generated by the following code
    for (let i = 0; i + 1 < this.children.length; i += 1) {
      const start = this.children[i];
      const end = this.children[i + 1];

      theCurves.push(Curve.createFromSegments(start, end));
    }

    return theCurves;
  },

  computeBounds() {
    const curves = this.curves();
    let bounds;

    // no curves
    if (curves.length === 0) {
      bounds = Rectangle.create();
      this.bounds = bounds;
      return bounds;
    }

    // a single, degenerate curve
    if (curves.length === 1 && curves[0].isDegenerate()) {
      bounds = Rectangle.create();
      this.bounds = bounds;
      return bounds;
    }

    // one or more (non-degenerate) curves

    bounds = curves[0] && curves[0].bounds; // computed by Bezier plugin

    for (let i = 1; i < curves.length; i += 1) {
      const curveBounds = curves[i].bounds;
      bounds = bounds.getBoundingRect(curveBounds);
    }

    this.bounds = bounds;
    return bounds;
  },
});

Object.defineProperty(Spline, 'bounds', {
  get() {
    if (this.payload.bounds) {
      return this.payload.bounds;
    }

    return this.computeBounds();
  },

  set(value) {
    this.payload.bounds = value;
  },
});

export { Spline };
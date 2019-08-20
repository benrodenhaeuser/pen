import { SceneNode } from './_.js';
import { Segment } from './_.js';
import { Rectangle } from '../geometry/_.js';
import { Curve } from '../geometry/_.js';
import { types } from './_.js';

const Spline = Object.create(SceneNode);

Object.defineProperty(Spline, 'bounds', {
  get() {
    return this.props.bounds || this.computeBounds();
  },

  set(value) {
    this.props.bounds = value;
  },
});

Object.assign(Spline, {
  create(opts = {}) {
    return SceneNode.create
      .bind(this)()
      .set({ type: types.SPLINE })
      .set(opts);
  },

  mountSegment() {
    const segment = Segment.create();
    this.mount(segment);
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

  commands() {
    const commands = [];

    const segment = this.children[0];
    commands.push([
      'M',
      [
        `${segment.anchor.vector.x} ${segment.anchor.vector.y}`,
        segment.anchor.key,
        segment.anchor.class,
      ],
    ]);

    for (let i = 1; i < this.children.length; i += 1) {
      let command = [];

      const currSeg = this.children[i];
      const prevSeg = this.children[i - 1];

      if (prevSeg.handleOut && currSeg.handleIn) {
        command.push('C');
      } else if (currSeg.handleIn || prevSeg.handleOut) {
        command.push('Q');
      } else {
        command.push('L');
      }

      if (prevSeg.handleOut) {
        command.push([
          `${prevSeg.handleOut.vector.x} ${prevSeg.handleOut.vector.y}`,
          prevSeg.handleOut.key,
          prevSeg.handleOut.class,
        ]);
      }

      if (currSeg.handleIn) {
        command.push([
          `${currSeg.handleIn.vector.x} ${currSeg.handleIn.vector.y}`,
          currSeg.handleIn.key,
          currSeg.handleIn.class,
        ]);
      }

      command.push([
        `${currSeg.anchor.vector.x} ${currSeg.anchor.vector.y}`,
        currSeg.anchor.key,
        currSeg.anchor.class,
      ]);

      commands.push(command);
    }

    return commands;
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

export { Spline };

import { SceneNode } from './_.js';
import { Segment } from './_.js';
import { Rectangle } from '../geometry/_.js';
import { Curve } from '../geometry/_.js';
import { types } from './_.js';

const Spline = Object.create(SceneNode);
Spline.defineProps(['closed']);

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
      .set({
        type: types.SPLINE,
        closed: false,
      })
      .set(opts);
  },

  mountSegment() {
    const segment = Segment.create();
    this.mount(segment);
    return segment;
  },

  close() {
    this.closed = true;
  },

  open() {
    this.closed = false;
  },

  isClosed() {
    return this.closed === true;
  },

  curves() {
    const theCurves = [];

    switch (this.children.length) {
      case 1:
        theCurves.push(
          Curve.createFromSegments(this.children[0], Segment.create())
        );
        break;

      default:
        for (let i = 0; i + 1 < this.children.length; i += 1) {
          theCurves.push(
            Curve.createFromSegments(this.children[i], this.children[i + 1])
          );
        }

        if (this.isClosed()) {
          theCurves.push(
            Curve.createFromSegments(
              this.children[this.children.length - 1],
              this.children[0]
            )
          );
        }
    }

    return theCurves;
  },

  commands() {
    const commands = [];

    commands.push(this.command(this.children[0])); // 'M' command

    for (let i = 1; i < this.children.length; i += 1) {
      commands.push(this.command(this.children[i - 1], this.children[i]));
    }

    if (this.isClosed()) {
      commands.push(
        this.command(this.children[this.children.length - 1], this.children[0])
      );

      commands.push(this.command()); // 'Z' command
    }

    return commands;
  },

  command(fromSegment, toSegment) {
    const command = [];

    if (fromSegment && toSegment) {
      if (fromSegment.handleOut && toSegment.handleIn) {
        command.push('C');
      } else if (fromSegment.handleOut || toSegment.handleIn) {
        command.push('Q');
      } else {
        command.push('L');
      }

      if (fromSegment.handleOut) {
        command.push([
          fromSegment.handleOut.toString(),
          fromSegment.handleOut.key,
          fromSegment.handleOut.class,
        ]);
      }

      if (toSegment.handleIn) {
        command.push([
          toSegment.handleIn.toString(),
          toSegment.handleIn.key,
          toSegment.handleIn.class,
        ]);
      }

      command.push([
        toSegment.anchor.toString(),
        toSegment.anchor.key,
        toSegment.anchor.class,
      ]);
    } else if (fromSegment) {
      command.push('M');
      command.push([
        this.children[0].anchor.toString(),
        this.children[0].anchor.key,
        this.children[0].anchor.class,
      ]);
    } else {
      command.push('Z');
    }

    return command;
  },

  computeBounds() {
    const curves = this.curves();
    let bounds;

    // TODO: make a switch statement

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

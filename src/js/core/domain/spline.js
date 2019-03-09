import { Segment }   from './segment.js';
import { Vector }    from './vector.js';
import { Curve }     from './curve.js';
import { Rectangle } from './rectangle.js';

const Spline = {
  create(segments = []) {
    return Object.create(Spline).init(segments);
  },

  init(segments) {
    this.segments = segments;

    return this;
  },

  createFromCommands(commands) {
    const segments = this.parseCommands(commands);
    return Spline.create(segments);
  },

  parseCommands(commands) {
    const segments = [];

    // the first command is ALWAYS an `M` command (no handles)
    segments[0] = Segment.create({
      anchor: Vector.create(commands[0].x, commands[0].y)
    });

    for (let i = 1; i < commands.length; i += 1) {
      const command  = commands[i];
      const prevSeg  = segments[i - 1];
      const currSeg  = Segment.create();
      currSeg.anchor = Vector.create(command.x, command.y);

      if (command.x1 && command.x2) {
        prevSeg.handleOut = Vector.create(command.x1, command.y1);
        currSeg.handleIn  = Vector.create(command.x2, command.y2);
      } else if (command.x1) {
        currSeg.handleIn  = Vector.create(command.x1, command.y1);
      }

      segments[i] = currSeg;
    }

    return segments;
  },

  curves() {
    const theCurves = [];

    // from n segments, we obtain n - 1 curves
    for (let i = 0; i + 1 < this.segments.length; i += 1) {
      const start = this.segments[i];
      const end = this.segments[i + 1];

      theCurves.push(Curve.createFromSegments(start, end));
    }

    return theCurves;
  },

  bounds() {
    let splineBounds;

    if (this.segments.length === 1) {
      splineBounds = Rectangle.createFromMinMax(vector.anchor, vector.anchor);
      // ^ TODO: I think this is difficult to draw, because it has no dimensions.
    } else {
      const curves  = this.curves();
      splineBounds = curves[0].bounds();

      for (let i = 1; i < curves.length; i += 1) {
        const curveBounds = curves[i].bounds();
        splineBounds = splineBounds.getBoundingRect(curveBounds);
      }
    }

    return splineBounds;
  },

  toJSON() {
    return this.segments; // array
  },
};

export { Spline };

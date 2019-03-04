import { Segment } from './segment.js';
import { Vector } from './vector.js';

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
    // TODO: turn spline segments into curves
    // every consecutive pair of segments gives rise to a curve
  },

  bbox() {
    // TODO: compute the bbox of all the curves in the spline
  },

  toJSON() {
    return this.segments; // array
  },
};

export { Spline };

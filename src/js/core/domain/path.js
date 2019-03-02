import { SVGPathData, SVGPathDataTransformer } from 'svg-pathdata';
import { Spline } from './spline.js';

const MOVE = 2; // constant used by svg-pathdata module

const Path = {
  createFromRect(x, y, width, height) {
    const commands = this.commands(`
      M ${x} ${y}
      H ${x + width}
      V ${y + height}
      H ${x}
      Z
    `);

    return this.create(commands);
  },

  createFromSVGpath(d) {
    return this.create(this.commands(d));
  },

  create(commands) {
    return Object.create(Path).init(commands);
  },

  init(commands) {
    this.splines = [];
    const sequences = [];

    for (let command of commands) {
      if (command.type === MOVE) {
        sequences.push([command]);
      } else {
        sequences[sequences.length - 1].push(command);
      }
    }

    for (let sequence of sequences) {
      this.splines.push(Spline.createFromCommands(sequence));
    }

    return this;
  },

  commands(svgPath) {
    return new SVGPathData(svgPath)
      .transform(SVGPathDataTransformer.NORMALIZE_HVZ()) // no H, V or Z shortcuts
      .transform(SVGPathDataTransformer.NORMALIZE_ST())  // no S (smooth multi-Bezier)
      .transform(SVGPathDataTransformer.A_TO_C())        // no A (arcs)
      .toAbs()                                           // no relative commands
      .commands;
  },

  toJSON() {
    return this.splines; // array
  },
}


export { Path };

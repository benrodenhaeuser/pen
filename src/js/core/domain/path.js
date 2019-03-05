import { SVGPathData }            from 'svg-pathdata';
import { SVGPathDataTransformer } from 'svg-pathdata';
import { Rectangle }              from './rectangle.js';
import { Spline }                 from './spline.js';

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

  bBox() {
    const splines = this.splines;
    let pathBox   = splines[0].bBox();

    for (let i = 1; i < this.splines.length; i += 1) {
      const splineBox = this.splines[i].bBox();
      pathBox = pathBox.getBoundingRect(splineBox);
    }
    return pathBox;
  },

  encodeSVGPath() {
    let d = '';

    for (let spline of this.splines) {
      // console.log(spline);
      const moveto = spline.segments[0];
      d += `M ${moveto.anchor.x} ${moveto.anchor.y}`;

      for (let i = 1; i < spline.segments.length; i += 1) {
        const curr = spline.segments[i];
        const prev = spline.segments[i - 1];

        if (prev.handleOut && curr.handleIn) {
          d += ' C';
        } else if (curr.handleIn) {
          d += ' Q';
        } else {
          d += ' L';
        }

        if (prev.handleOut) {
          d += ` ${prev.handleOut.x} ${prev.handleOut.y}`;
        }

        if (curr.handleIn) {
          d += ` ${curr.handleIn.x} ${curr.handleIn.y}`;
        }

        d += ` ${curr.anchor.x} ${curr.anchor.y}`;
      }
    }

    return d;
  },

  toJSON() {
    return this.splines; // array
  },
}


export { Path };

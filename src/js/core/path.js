import { SVGPathData, SVGPathDataTransformer, encodeSVGPath } from 'svg-pathdata';
import { Segment } from './segment.js';
import { Vector } from './matrix.js';

const MOVE = 2;

const Path = {
  create(pathData) {
    return Object.create(Path).init(pathData);
  },

  init(pathData) {
    const cleanCommands = this.getCleanCommands(pathData);

    this.data = [];
    let segment;

    for (let command of cleanCommands) {
      if (command.type === MOVE) {
        segment = Segment.create(
          'move',
          [Vector.createWithID(command.x, command.y)]
        );
      } else {
        const controls = [];

        if (command.x1) {
          controls.push(Vector.createWithID(command.x1, command.y1));
        }
        if (command.x2) {
          controls.push(Vector.createWithID(command.x2, command.y2));
        }
        controls.push(Vector.createWithID(command.x, command.y));

        segment = Segment.create(
          'draw',
          controls
        );
      }

      this.data.push(segment);
    }

    return this;
  },

  getCleanCommands(pathData) {
    let pathDataObject;
    if (typeof pathData === 'string') {
      pathDataObject = new SVGPathData(pathData);
    } else {
      pathDataObject = new SVGPathData(encodeSVGPath(pathData));
    }

    pathDataObject
      .transform(SVGPathDataTransformer.NORMALIZE_HVZ()) // no H, V or Z
      .transform(SVGPathDataTransformer.NORMALIZE_ST())  // no S
      .transform(SVGPathDataTransformer.A_TO_C())        // no A
      .toAbs()                                           // no relative commands
      .transform(SVGPathDataTransformer.ROUND(2));      // TODO: just for debugging

    return pathDataObject.commands;
  },

  toJSON() {
    return this.data;
  },
}


export { Path };

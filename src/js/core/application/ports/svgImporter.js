import { Scene, Shape, Group     } from '../domain/nodes.js';
import { Spline, Segment, Anchor } from '../domain/nodes.js';
import { HandleIn, HandleOut     } from '../domain/nodes.js';
import { Matrix                  } from '../domain/geometry.js';
import { Vector                  } from '../domain/geometry.js';
import { Rectangle               } from '../domain/geometry.js';
import { Class                   } from '../domain/helpers.js';
import { SVGPathData             } from 'svg-pathdata';
import { SVGPathDataTransformer  } from 'svg-pathdata';

const svgImporter = {
  build(markup) {
    const $svg = new DOMParser()
      .parseFromString(markup, "image/svg+xml")
      .documentElement;

    if ($svg instanceof SVGElement) {
      const scene = Scene.create();
      this.buildTree($svg, scene);
      scene.setFrontier();
      console.log('done importing svg markup');
      return scene;
    }

    console.log('import from svg markup did not succeed');

    return null;
  },

  copyStyles($node, node) {
    node.styles = Array.from($node.querySelectorAll('style'));
  },

  copyDefs($node, node) {
    node.defs = Array.from($node.querySelectorAll('style'));
  },

  buildTree($node, node) {
    this.processAttributes($node, node);

    const $graphicsChildren = Array.from($node.children).filter(($child) => {
      return $child instanceof SVGGElement || $child instanceof SVGGeometryElement
    });

    for (let $child of $graphicsChildren) {
      let child;

      if ($child instanceof SVGGElement) {
        child = Group.create();
        node.append(child);
        this.buildTree($child, child);
      } else {
        child = this.buildShapeTree($child);
        node.append(child);
      }
    }
  },

  processAttributes($node, node) {
    // viewBox
    if ($node.tagName === 'svg') {
      const viewBox = $node.getAttributeNS(null, 'viewBox').split(' ');
      const origin = Vector.create(viewBox[0], viewBox[1]);
      const size = Vector.create(viewBox[2], viewBox[3]);
      node.viewBox = Rectangle.create(origin, size);
    }

    // transform
    if (
      $node.transform &&
      $node.transform.baseVal &&
      $node.transform.baseVal.consolidate()
    ) {
      const $matrix = $node.transform.baseVal.consolidate().matrix;
      node.transform = Matrix.createFromDOMMatrix($matrix);
    }

    // classes
    node.class = Class.create(
      Array.from($node.classList)
    );
  },

  buildShapeTree($geometryNode) {
    const shape = Shape.create();

    this.processAttributes($geometryNode, shape);
    // ^ TODO: we are also calling processAttributes further above, duplication!

    let pathCommands;

    switch ($geometryNode.tagName) {
      case 'rect':
        const x      = Number($geometryNode.getAttributeNS(null, 'x'));
        const y      = Number($geometryNode.getAttributeNS(null, 'y'));
        const width  = Number($geometryNode.getAttributeNS(null, 'width'));
        const height = Number($geometryNode.getAttributeNS(null, 'height'));

        pathCommands = this.commands(`
          M ${x} ${y}
          H ${x + width}
          V ${y + height}
          H ${x}
          Z
        `);
        break;
      case 'path':
        pathCommands = this.commands($geometryNode.getAttributeNS(null, 'd'));
        break;
    }

    const pathSequences = this.sequences(pathCommands);

    for (let sequence of pathSequences) {
      shape.append(this.buildSplineTree(sequence));
    }

    return shape;
  },

  buildSplineTree(sequence) {
    const spline = Spline.create();
    for (let segment of this.buildSegmentList(sequence)) {
      spline.append(segment);
    }

    return spline;
  },

  // helpers

  // we want a segment to have children 'handleIn', 'anchor' etc

  buildSegmentList(commands) {
    const segments = [];

    // the first command is ALWAYS an `M` command (no handles)
    segments[0] = Segment.create();
    const child = Anchor.create();
    child.payload.vector = Vector.create(commands[0].x, commands[0].y);
    segments[0].append(child);

    for (let i = 1; i < commands.length; i += 1) {
      const command  = commands[i];
      const prevSeg  = segments[i - 1];
      const currSeg  = Segment.create();

      const anchor = Anchor.create();
      anchor.payload.vector = Vector.create(command.x, command.y);
      currSeg.append(anchor);

      if (command.x1 && command.x2) {
        const handleOut = HandleOut.create();
        handleOut.payload.vector = Vector.create(command.x1, command.y1);
        prevSeg.append(handleOut);

        const handleIn = HandleIn.create();
        handleIn.payload.vector = Vector.create(command.x2, command.y2);
        currSeg.append(handleIn);

      } else if (command.x1) {
        const handleIn = HandleIn.create();
        handleIn.payload.vector = Vector.create(command.x1, command.y1);
        currSeg.append(handleIn);
      }

      segments[i] = currSeg;
    }

    return segments;
  },

  sequences(svgCommands) {
    const MOVE = 2; // NOTE: this constant is introduced by svg-pathdata module
    const theSequences = [];

    for (let command of svgCommands) {
      if (command.type === MOVE) {
        theSequences.push([command]);
      } else {
        theSequences[theSequences.length - 1].push(command);
      }
    }

    return theSequences;
  },

  commands(svgPath) {
    return new SVGPathData(svgPath)
      .transform(SVGPathDataTransformer.NORMALIZE_HVZ()) // no H, V or Z shortcuts
      .transform(SVGPathDataTransformer.NORMALIZE_ST())  // no S (smooth multi-Bezier)
      .transform(SVGPathDataTransformer.A_TO_C())        // no A (arcs)
      .toAbs()                                           // no relative commands
      .commands;
  },
};

export { svgImporter };

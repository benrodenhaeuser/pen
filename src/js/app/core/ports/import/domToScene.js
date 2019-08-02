import { Canvas, Shape, Group } from '../../domain/_.js';
import { Spline, Segment, Anchor } from '../../domain/_.js';
import { HandleIn, HandleOut } from '../../domain/_.js';
import { Matrix } from '../../domain/_.js';
import { Vector } from '../../domain/_.js';
import { Rectangle } from '../../domain/_.js';
import { Class } from '../../domain/_.js';
import { SVGPathData } from 'svg-pathdata';
import { SVGPathDataTransformer } from 'svg-pathdata';

const domToScene = $svg => {
  if ($svg instanceof SVGElement) {
    const canvas = Canvas.create();
    canvas.key = $svg.key;
    buildTree($svg, canvas);
    canvas.updateFrontier();
    return canvas;
  } else {
    return null;
  }
};

const copyStyles = ($node, node) => {
  node.styles = Array.from($node.querySelectorAll('style'));
};

const copyDefs = ($node, node) => {
  node.defs = Array.from($node.querySelectorAll('style'));
};

const buildTree = ($node, node) => {
  processAttributes($node, node);

  const $graphicsChildren = Array.from($node.children).filter($child => {
    return (
      $child instanceof SVGGElement || $child instanceof SVGGeometryElement
    );
  });

  for (let $child of $graphicsChildren) {
    let child;

    if ($child instanceof SVGGElement) {
      child = Group.create();
      child.key = $child.key;
      node.append(child);
      buildTree($child, child);
    } else {
      child = buildShapeTree($child);
      node.append(child);
    }
  }
};

const processAttributes = ($node, node) => {
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
  node.class = Class.create(Array.from($node.classList));
};

const buildShapeTree = $geometryNode => {
  const shape = Shape.create();
  shape.key = $geometryNode.key;

  processAttributes($geometryNode, shape);
  // ^ TODO: we are also calling processAttributes further above, duplication!

  let pathCommands;

  switch ($geometryNode.tagName) {
    case 'rect':
      const x = Number($geometryNode.getAttributeNS(null, 'x'));
      const y = Number($geometryNode.getAttributeNS(null, 'y'));
      const width = Number($geometryNode.getAttributeNS(null, 'width'));
      const height = Number($geometryNode.getAttributeNS(null, 'height'));

      pathCommands = commands(`
        M ${x} ${y}
        H ${x + width}
        V ${y + height}
        H ${x}
        Z
      `);
      break;
    case 'path':
      pathCommands = commands($geometryNode.getAttributeNS(null, 'd'));
      break;
  }

  const pathSequences = sequences(pathCommands);

  for (let sequence of pathSequences) {
    shape.append(buildSplineTree(sequence));
  }

  return shape;
};

const buildSplineTree = sequence => {
  const spline = Spline.create();
  for (let segment of buildSegmentList(sequence)) {
    spline.append(segment);
  }

  return spline;
};

// helpers

// we want a segment to have children 'handleIn', 'anchor' etc

const buildSegmentList = commands => {
  const segments = [];

  // the first command is ALWAYS an `M` command (no handles)
  segments[0] = Segment.create();
  const child = Anchor.create();
  child.vector = Vector.create(commands[0].x, commands[0].y);
  segments[0].append(child);

  for (let i = 1; i < commands.length; i += 1) {
    const command = commands[i];
    const prevSeg = segments[i - 1];
    const currSeg = Segment.create();

    const anchor = Anchor.create();
    anchor.vector = Vector.create(command.x, command.y);
    currSeg.append(anchor);

    if (command.x1 && command.x2) {
      const handleOut = HandleOut.create();
      handleOut.vector = Vector.create(command.x1, command.y1);
      prevSeg.append(handleOut);

      const handleIn = HandleIn.create();
      handleIn.vector = Vector.create(command.x2, command.y2);
      currSeg.append(handleIn);
    } else if (command.x1) {
      const handleIn = HandleIn.create();
      handleIn.vector = Vector.create(command.x1, command.y1);
      currSeg.append(handleIn);
    }

    segments[i] = currSeg;
  }

  return segments;
};

const sequences = svgCommands => {
  const MOVE = 2; // NOTE: constant is introduced by svg-pathdata module
  const theSequences = [];

  for (let command of svgCommands) {
    if (command.type === MOVE) {
      theSequences.push([command]);
    } else {
      theSequences[theSequences.length - 1].push(command);
    }
  }

  return theSequences;
};

const commands = svgPath => {
  return new SVGPathData(svgPath)
    .transform(SVGPathDataTransformer.NORMALIZE_HVZ()) // no H, V or Z shortcuts
    .transform(SVGPathDataTransformer.NORMALIZE_ST()) // no S (smooth multi-Bezier)
    .transform(SVGPathDataTransformer.A_TO_C()) // no A (arcs)
    .toAbs().commands; // no relative commands
};

export { domToScene };

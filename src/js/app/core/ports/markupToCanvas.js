import { Canvas, Shape, Group } from '../domain/_.js';
import { Spline, Segment, Anchor } from '../domain/_.js';
import { HandleIn, HandleOut } from '../domain/_.js';
import { Matrix } from '../domain/_.js';
import { Vector } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';
import { Class } from '../domain/_.js';
import { SVGPathData } from 'svg-pathdata';
import { SVGPathDataTransformer } from 'svg-pathdata';

const markupToCanvas = markup => {
  const $svg = markupToDOM(markup);

  if ($svg) {
    return domToScene($svg);
  } else {
    return null;
  }
};

const markupToDOM = markup => {
  const $svg = new DOMParser().parseFromString(markup, 'image/svg+xml')
    .documentElement;

  if ($svg instanceof SVGElement) {
    return $svg;
  } else {
    return null;
  }
};

const domToScene = $svg => {
  const canvas = Canvas.create();
  buildTree($svg, canvas);
  canvas.updateFrontier();
  return canvas;
};

// TODO: unused
const copyStyles = ($node, node) => {
  node.styles = Array.from($node.querySelectorAll('style'));
};

// TODO: unused
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
      buildTree($child, child);
      node.mount(child);
    } else {
      child = buildShapeTree($child);
      node.mount(child);
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

  // fill
  if ($node.attributes.fill) {
    node.fill = $node.getAttributeNS(null, 'fill');
  }

  // stroke
  if ($node.attributes.stroke) {
    node.stroke = $node.getAttributeNS(null, 'stroke');
  }
};

const buildShapeTree = $geometryNode => {
  const shape = Shape.create();

  processAttributes($geometryNode, shape);

  let pathCommands;

  switch ($geometryNode.tagName) {
    // TODO: unused
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
    const spline = buildSplineTree(sequence);
    shape.mount(spline);
  }

  return shape;
};

const buildSplineTree = sequence => {
  const spline = Spline.create();
  for (let segment of buildSegmentList(sequence, spline)) {
    spline.mount(segment);
  }

  return spline;
};

const buildSegmentList = (commands, spline) => {
  const segments = [];

  // the first command is ALWAYS an `M` command (no handles)

  // TODO: the first segment *may* need a handleIn
  //       and the last segment *may* need a handleOut

  segments[0] = Segment.create();
  const child = Anchor.create();
  child.vector = Vector.create(commands[0].x, commands[0].y);
  segments[0].mount(child);

  for (let i = 1; i < commands.length; i += 1) {
    const command = commands[i];
    const prevSeg = segments[i - 1];
    const currSeg = Segment.create();

    const anchor = Anchor.create();
    anchor.vector = Vector.create(command.x, command.y);
    currSeg.mount(anchor);

    if (command.x1 && command.x2) {
      const handleOut = HandleOut.create();
      handleOut.vector = Vector.create(command.x1, command.y1);
      prevSeg.mount(handleOut);

      const handleIn = HandleIn.create();
      handleIn.vector = Vector.create(command.x2, command.y2);
      currSeg.mount(handleIn);
    } else if (command.x1) {
      const handleIn = HandleIn.create();
      handleIn.vector = Vector.create(command.x1, command.y1);
      currSeg.mount(handleIn);
    } else { // ... it's a Z command
      spline.close(); // TODO: new
      return segments; // TODO: early return to avoid pushing a segment when command is "Z" --- I think this is correct?
    }

    segments[i] = currSeg;
  }

  return segments;
};

const sequences = svgCommands => {
  const MOVE = 2; // NOTE: constant is introduced by svg-pathdata module
  // const CLOSE = 1; // NOTE: constant is introduced by svg-pathdata module
  const theSequences = [];

  for (let command of svgCommands) {
    if (command.type === MOVE) {
      theSequences.push([command]);
    } else {
      theSequences[theSequences.length - 1].push(command);
    }
  }

  console.log(theSequences);

  return theSequences;
};

const commands = svgPath => {
  return new SVGPathData(svgPath)
    .transform(SVGPathDataTransformer.NORMALIZE_HVZ(false))
    // ^ no H or V shortcuts (we do use Z)
    .transform(SVGPathDataTransformer.NORMALIZE_ST()) // no S (smooth multi-Bezier)
    .transform(SVGPathDataTransformer.A_TO_C()) // no A (arcs)
    .toAbs().commands; // no relative commands
};

export { markupToCanvas };

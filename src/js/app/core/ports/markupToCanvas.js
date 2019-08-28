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
      node.mount(child);
      buildTree($child, child);
      // ^ the order of the preceding two lines cannot be reversed
      //   if the order is reserved, node heights are set incorrectly
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

  let pathData;

  switch ($geometryNode.tagName) {
    // TODO: not used
    case 'rect':
      const x = Number($geometryNode.getAttributeNS(null, 'x'));
      const y = Number($geometryNode.getAttributeNS(null, 'y'));
      const width = Number($geometryNode.getAttributeNS(null, 'width'));
      const height = Number($geometryNode.getAttributeNS(null, 'height'));

      pathData = pathDataParser(`
        M ${x} ${y}
        H ${x + width}
        V ${y + height}
        H ${x}
        Z
      `);
      break;
    case 'path':
      pathData = pathDataParser($geometryNode.getAttributeNS(null, 'd'));
      break;
  }

  const pathDataPerSpline = splitPathData(pathData);

  for (let sequence of pathDataPerSpline) {
    const spline = buildSplineTree(sequence);
    shape.mount(spline);
  }

  return shape;
};

const buildSplineTree = pathData => {
  const CLOSE = 1; // NOTE: constant is introduced by svg-pathdata module
  const spline = Spline.create({
    closed: pathData[pathData.length - 1].type === CLOSE,
  });

  const segments = buildSegmentList(pathData, spline);
  for (let segment of segments) {
    spline.mount(segment);
  }

  return spline;
};

const buildSegmentList = (pathData, spline) => {
  const segments = [];

  segments.push(
    Segment.create().mount(
      Anchor.create({
        vector: Vector.create(pathData[0].x, pathData[0].y),
      })
    )
  );

  // the pathData for a closed spline has two additional pathDataItems
  // that we do not wish to add as segments
  const upperBound = spline.isClosed() ? pathData.length - 2 : pathData.length;

  for (let i = 1; i < upperBound; i += 1) {
    segments.push(makeSegment(pathData[i], segments[i - 1]));
  }

  addRotatedHandles(segments);

  return segments;
};

const makeSegment = (pathDataItem, prevSeg) => {
  // structure of pathDataItem (from vendor):
  // (pathDataItem.x, pathDataItem.y) represents anchor
  // (pathDataItem.x1 or x2, pathDataItem.y1 or y2) represent handles

  const currSeg = Segment.create().mount(
    Anchor.create({
      vector: Vector.create(pathDataItem.x, pathDataItem.y),
    })
  );

  if (pathDataItem.x1 && pathDataItem.x2) {
    prevSeg.mount(
      HandleOut.create({
        vector: Vector.create(pathDataItem.x1, pathDataItem.y1),
      })
    );

    currSeg.mount(
      HandleIn.create({
        vector: Vector.create(pathDataItem.x2, pathDataItem.y2),
      })
    );
  } else if (pathDataItem.x1) {
    currSeg.mount(
      HandleIn.create({
        vector: Vector.create(pathDataItem.x1, pathDataItem.y1),
      })
    );
  }

  return currSeg;
};

const addRotatedHandles = segments => {
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  if (firstSegment.handleOut) {
    firstSegment.mount(
      HandleIn.create({
        vector: firstSegment.handleOut.vector.rotate(
          Math.PI,
          firstSegment.anchor.vector
        ),
      })
    );
  }

  if (lastSegment.handleIn) {
    lastSegment.mount(
      HandleOut.create({
        vector: lastSegment.handleIn.vector.rotate(
          Math.PI,
          lastSegment.anchor.vector
        ),
      })
    );
  }
};

const splitPathData = pathData => {
  const MOVE = 2; // NOTE: constant is introduced by svg-pathdata module
  const pathDataLists = [];

  for (let pathDataItem of pathData) {
    if (pathDataItem.type === MOVE) {
      pathDataLists.push([pathDataItem]);
    } else {
      pathDataLists[pathDataLists.length - 1].push(pathDataItem);
    }
  }

  return pathDataLists;
};

const pathDataParser = d => {
  return (
    new SVGPathData(d)
      .transform(SVGPathDataTransformer.NORMALIZE_HVZ(false))
      // ^ no H or V shortcuts (but we do use Z, hence the `false`)
      .transform(SVGPathDataTransformer.NORMALIZE_ST()) // no S (smooth multi-Bezier)
      .transform(SVGPathDataTransformer.A_TO_C()) // no A (arcs)
      .toAbs().commands // no relative commands
  );
};

export { markupToCanvas };

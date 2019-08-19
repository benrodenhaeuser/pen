import { h } from './_.js';
import { types } from '../_.js';

const LENGTHS_IN_PX = {
  cornerSideLength: 8,
  dotDiameter: 18,
  controlDiameter: 5.5,
};

const canvas = editor => {
  return renderScene(editor);
};

const renderScene = editor => {
  if (editor.canvas === null) {
    return '';
  }

  return buildTree(editor.canvas);
};

const buildTree = (node, vParent = null) => {
  const vNode = node.toVDOMNode();

  if (vParent) {
    const vWrapper = wrap(vNode, node);
    vParent.children.push(vWrapper); // append vWrapper to vParent
  }

  for (let child of node.graphicsChildren) {
    buildTree(child, vNode); // append children to vNode (which is inside vWrapper)
  }

  return vNode;
};

const wrap = (vNode, node) => {
  const vWrapper = h('g', {
    'data-type': `${node.type}-wrapper`,
    'data-key': node.key,
  });

  vWrapper.children.push(vNode);

  if (node.type === types.SHAPE) {
    vWrapper.children.push(curves(node));
    vWrapper.children.push(segments(node));
  }

  vWrapper.children.push(outerUI(node));

  return vWrapper;
};

const curves = node => {
  const diameter = scale(node, LENGTHS_IN_PX.controlDiameter);
  const radius = diameter / 2;

  const vParts = node.toVDOMCurves(); // TODO
  const splitter = h('circle', {
    'data-type': 'splitter',
    r: radius,
    cx: node.splitter.x,
    cy: node.splitter.y,
    transform: node.transform && node.transform.toString(),
  });

  return h(
    'g',
    {
      'data-type': 'curves',
      'data-key': node.key,
    },
    ...vParts,
    splitter
  );
};

const outerUI = node => {
  const vOuterUI = h('g', {
    'data-type': 'outerUI',
    'data-key': node.key,
  });

  const vFrame = frame(node);
  const vDots = dots(node); // for rotation UI
  const vCorners = corners(node); // for scaling UI

  vOuterUI.children.push(vFrame);

  for (let vDot of vDots) {
    vOuterUI.children.push(vDot);
  }

  for (let vCorner of vCorners) {
    vOuterUI.children.push(vCorner);
  }

  return vOuterUI;
};

const corners = node => {
  const vTopLCorner = h('rect');
  const vBotLCorner = h('rect');
  const vTopRCorner = h('rect');
  const vBotRCorner = h('rect');
  const vCorners = [vTopLCorner, vBotLCorner, vTopRCorner, vBotRCorner];
  const length = scale(node, LENGTHS_IN_PX.cornerSideLength);

  for (let vCorner of vCorners) {
    Object.assign(vCorner.props, {
      'data-type': 'corner',
      'data-key': node.key,
      transform: node.transform && node.transform.toString(),
      width: length,
      height: length,
    });
  }

  Object.assign(vTopLCorner.props, {
    x: node.bounds.x - length / 2,
    y: node.bounds.y - length / 2,
  });

  Object.assign(vBotLCorner.props, {
    x: node.bounds.x - length / 2,
    y: node.bounds.y + node.bounds.height - length / 2,
  });

  Object.assign(vTopRCorner.props, {
    x: node.bounds.x + node.bounds.width - length / 2,
    y: node.bounds.y - length / 2,
  });

  Object.assign(vBotRCorner.props, {
    x: node.bounds.x + node.bounds.width - length / 2,
    y: node.bounds.y + node.bounds.height - length / 2,
  });

  return vCorners;
};

const dots = node => {
  const vTopLDot = h('circle');
  const vBotLDot = h('circle');
  const vTopRDot = h('circle');
  const vBotRDot = h('circle');
  const vDots = [vTopLDot, vBotLDot, vTopRDot, vBotRDot];
  const diameter = scale(node, LENGTHS_IN_PX.dotDiameter);
  const radius = diameter / 2;

  for (let vDot of vDots) {
    Object.assign(vDot.props, {
      'data-type': 'dot',
      'data-key': node.key,
      transform: node.transform && node.transform.toString(),
      r: radius,
    });
  }

  Object.assign(vTopLDot.props, {
    cx: node.bounds.x - radius / 2,
    cy: node.bounds.y - radius / 2,
  });

  Object.assign(vBotLDot.props, {
    cx: node.bounds.x - radius / 2,
    cy: node.bounds.y + node.bounds.height + radius / 2,
  });

  Object.assign(vTopRDot.props, {
    cx: node.bounds.x + node.bounds.width + radius / 2,
    cy: node.bounds.y - radius / 2,
  });

  Object.assign(vBotRDot.props, {
    cx: node.bounds.x + node.bounds.width + radius / 2,
    cy: node.bounds.y + node.bounds.height + radius / 2,
  });

  return vDots;
};

const frame = node => {
  return h('rect', {
    'data-type': 'frame',
    x: node.bounds.x,
    y: node.bounds.y,
    width: node.bounds.width,
    height: node.bounds.height,
    transform: node.transform && node.transform.toString(),
    'data-key': node.key,
  });
};

const segments = node => {
  const spline = node.children[0];

  const vSegments = h('g', {
    'data-type': 'segments',
    'data-key': node.key,
  });

  for (let segment of spline.children) {
    vSegments.children.push(segmentUI(node, segment));
  }

  return vSegments;
};

const segmentUI = (node, segment) => {
  const vSegmentUI = h('g', {
    'data-type': 'segment',
    class: segment.class.toString(),
    'data-key': node.key,
  });

  const diameter = scale(node, LENGTHS_IN_PX.controlDiameter);

  for (let handle of ['handleIn', 'handleOut']) {
    if (segment[handle]) {
      vSegmentUI.children.push(
        connection(node, segment.anchor, segment[handle])
      );
    }
  }

  for (let controlNode of segment.children) {
    vSegmentUI.children.push(control(node, controlNode, diameter));
  }

  return vSegmentUI;
};

const connection = (node, anchor, handle) => {
  return h('line', {
    'data-type': 'connection',
    x1: anchor.vector.x,
    y1: anchor.vector.y,
    x2: handle.vector.x,
    y2: handle.vector.y,
    transform: node.transform && node.transform.toString(),
  });
};

const control = (pathNode, controlNode, diameter) => {
  return h('circle', {
    'data-type': controlNode.type,
    'data-key': controlNode.key,
    transform: pathNode.transform && pathNode.transform.toString(),
    r: diameter / 2,
    cx: controlNode.vector.x,
    cy: controlNode.vector.y,
    class: controlNode.class.toString(),
  });
};

const scale = (node, length) => {
  return length / node.globalScaleFactor();
};

export { canvas };

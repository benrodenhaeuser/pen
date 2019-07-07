import { h } from './h.js';

const LENGTHS_IN_PX = {
  cornerSideLength: 8,
  dotDiameter:      18,
  controlDiameter:  6,
};


const canvas = (store) => {
  return renderScene(store);
};

const renderScene = (store) => {
  if (store.scene === null) {
    return '';
  }

  return buildTree(store.scene);
};

const buildTree = (node, vParent = null) => {
  let vNode;

  if (node.type === 'shape') {
    const diameter  = scale(node, LENGTHS_IN_PX.controlDiameter);
    const radius    = diameter / 2;

    const vParts = node.toVDOMCurves();
    const splitter = h('circle', {
      'data-type': 'splitter',
      r:           radius,
      cx: node.splitter.x,
      cy: node.splitter.y,
      transform:   node.transform.toString(),
    });

    vNode = h('g', {
      'data-type': 'content',
      class:       node.class.toString(),
      'data-key':  node.key,
    }, node.toVDOMNode(), ...vParts, splitter);
    // ^ the whole path followed by its curves
  } else {
    vNode = node.toVDOMNode();
  }

  if (vParent) {
    const vWrapper = wrap(vNode, node);
    vParent.children.push(vWrapper);
  }

  for (let child of node.graphicsChildren) {
    buildTree(child, vNode);
  }

  return vNode;
};

const wrap = (vNode, node) => {
  const vWrapper = h('g', {
    'data-type': `${node.type}-wrapper`,
    'data-key':   node.key,
  });

  vWrapper.children.push(vNode);

  if (node.type === 'shape') { vWrapper.children.push(innerUI(node)); }
  vWrapper.children.push(outerUI(node));

  return vWrapper;
};

const outerUI = (node) => {
  const vOuterUI = h('g', {
    'data-type': 'outerUI',
    'data-key':   node.key,
  });

  const vFrame   = frame(node);
  const vDots    = dots(node);    // for rotation UI
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

const corners = (node) => {
  const vTopLCorner = h('rect');
  const vBotLCorner = h('rect');
  const vTopRCorner = h('rect');
  const vBotRCorner = h('rect');
  const vCorners    = [vTopLCorner, vBotLCorner, vTopRCorner, vBotRCorner];
  const length      = scale(node, LENGTHS_IN_PX.cornerSideLength);

  for (let vCorner of vCorners) {
    Object.assign(vCorner.props, {
      'data-type': 'corner',
      'data-key':   node.key,
      transform:   node.transform.toString(),
      width:       length,
      height:      length,
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

const dots = (node) => {
  const vTopLDot  = h('circle');
  const vBotLDot  = h('circle');
  const vTopRDot  = h('circle');
  const vBotRDot  = h('circle');
  const vDots     = [vTopLDot, vBotLDot, vTopRDot, vBotRDot];
  const diameter  = scale(node, LENGTHS_IN_PX.dotDiameter);
  const radius    = diameter / 2;

  for (let vDot of vDots) {
    Object.assign(vDot.props, {
      'data-type':      'dot',
      'data-key':        node.key,
      transform:        node.transform.toString(),
      r:                radius,
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

const frame = (node) => {
  return h('rect', {
    'data-type':  'frame',
    x:            node.bounds.x,
    y:            node.bounds.y,
    width:        node.bounds.width,
    height:       node.bounds.height,
    transform:    node.transform.toString(),
    'data-key':    node.key,
  });
};

const innerUI = (node) => {
  const vInnerUI = h('g', {
    'data-type': 'innerUI',
    'data-key': node.key,
  });

  const vConnections = connections(node);

  for (let vConnection of vConnections) {
    vInnerUI.children.push(vConnection);
  }

  const vControls = controls(node);

  for (let vControl of vControls) {
    vInnerUI.children.push(vControl);
  }

  return vInnerUI;
};

const connections = (node) => {
  const vConnections = [];

  for (let spline of node.children) {
    for (let segment of spline.children) {
      for (let handle of ['handleIn', 'handleOut']) {
        if (segment[handle] !== null) {
          vConnections.push(connection(node, segment.anchor, segment[handle]));
        }
      }
    }
  }

  return vConnections;
};

const connection = (node, anchor, handle) => {
  return h('line', {
    x1:        anchor.x,
    y1:        anchor.y,
    x2:        handle.x,
    y2:        handle.y,
    transform: node.transform.toString(),
  });
};

const controls = (pathNode) => {
  const vControls = [];
  const diameter  = scale(pathNode, LENGTHS_IN_PX.controlDiameter);

  for (let spline of pathNode.children) {
    for (let segment of spline.children) {
      for (let aControl of segment.children) {
        vControls.push(control(pathNode, aControl, diameter));
      }
    }
  }

  return vControls;
};

const control = (pathNode, controlNode, diameter) => {
  return h('circle', {
    'data-type': 'control',
    'data-key' : controlNode.key,
    transform  : pathNode.transform.toString(),
    r          : diameter / 2,
    cx         : controlNode.vector.x,
    cy         : controlNode.vector.y,
  });
};

const scale = (node, length) => {
  return length / node.globalScaleFactor();
};

export { canvas };

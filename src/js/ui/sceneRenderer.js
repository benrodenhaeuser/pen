SVGElement.prototype.getSVGAttr = function(...args) {
  return this.getAttributeNS.apply(this, [null].concat(args));
};

SVGElement.prototype.setSVGAttr = function(...args) {
  return this.setAttributeNS.apply(this, [null].concat(args));
};

SVGElement.prototype.setSVGAttrs = function(obj) {
  for (let key of Object.keys(obj)) {
    this.setSVGAttr(key, obj[key]);
  }
};

const svgns = 'http://www.w3.org/2000/svg';
const xmlns = 'http://www.w3.org/2000/xmlns/';

const LENGTHS_IN_PX = {
  cornerSideLength: 8,
  dotDiameter:      9,
  controlDiameter:  6,
};

const scale = (node, length) => {
  return length / (node.globalScale * sceneRenderer.documentScale);
};

const sceneRenderer = {
  render(scene, $canvas) {
    canvas.innerHTML = '';
    this.build(scene, $canvas);
  },

  build(node, $parent) {
    const $node = document.createElementNS(svgns, node.tag);

    $node.setSVGAttrs(node.props);         // copy all the props
    $node.setSVGAttr('data-id', node._id); // every node has an id

    if (node.tag === 'svg') {
      $node.setAttributeNS(xmlns, 'xmlns', svgns);
      $node.setSVGAttr('data-type', 'root');

      const viewBox = [
        node.viewBox.x,
        node.viewBox.y,
        node.viewBox.width,
        node.viewBox.height
      ].join(' ');

      $node.setSVGAttr('viewBox', viewBox);

      $parent.appendChild($node);

      this.documentScale = this.canvasWidth / node.box.width;
    } else {
      const $wrapper = wrap($node, node);
      $parent.appendChild($wrapper);
    }

    for (let child of node.children) {
      sceneRenderer.build(child, $node);
    }
  },

  get canvasWidth() {
    const canvasNode = document.querySelector('#canvas');
    return canvasNode.clientWidth;
  },
};

const wrap = ($node, node) => {
  $node.setSVGAttrs({
    'data-type': 'content',
  });

  const $wrapper = wrapper(node);
  const $outerUI = outerUI(node);

  $wrapper.appendChild($node);

  if (node.path) {
    const $innerUI = innerUI(node);
    $wrapper.appendChild($innerUI);
  }

  $wrapper.appendChild($outerUI);

  return $wrapper;
};

const wrapper = (node) => {
  const $wrapper = document.createElementNS(svgns, 'g');

  $wrapper.setSVGAttrs({
    'data-type': 'wrapper',
    'data-id':   node._id,
  });

  return $wrapper;
};

const outerUI = (node) => {
  const $outerUI = document.createElementNS(svgns, 'g');

  $outerUI.setSVGAttrs({
    'data-type': 'outerUI',
    'data-id': node._id,
  });

  const $frame   = frame(node);
  const $corners = corners(node);
  const $dots    = dots(node);

  $outerUI.appendChild($frame);
  for (let corner of $corners) {
    $outerUI.appendChild(corner);
  }
  for (let dot of $dots) {
    $outerUI.appendChild(dot);
  }

  return $outerUI;
};

const corners = (node) => {
  const $topLCorner = document.createElementNS(svgns, 'rect');
  const $botLCorner = document.createElementNS(svgns, 'rect');
  const $topRCorner = document.createElementNS(svgns, 'rect');
  const $botRCorner = document.createElementNS(svgns, 'rect');
  const $corners    = [$topLCorner, $botLCorner, $topRCorner, $botRCorner];
  const length      = scale(node, LENGTHS_IN_PX.cornerSideLength);

  for (let corner of $corners) {
    corner.setSVGAttrs({
      'data-type': 'corner',
      'data-id':   node._id,
      transform:   node.props.transform,
      width:       length,
      height:      length,
    });
  }

  $topLCorner.setSVGAttrs({
    x: node.box.x - length / 2,
    y: node.box.y - length / 2,
  });

  $botLCorner.setSVGAttrs({
    x: node.box.x - length / 2,
    y: node.box.y + node.box.height - length / 2,
  });

  $topRCorner.setSVGAttrs({
    x: node.box.x + node.box.width - length / 2,
    y: node.box.y - length / 2,
  });

  $botRCorner.setSVGAttrs({
    x: node.box.x + node.box.width - length / 2,
    y: node.box.y + node.box.height - length / 2,
  });

  return $corners;
};

const dots = (node) => {
  const $topLDot  = document.createElementNS(svgns, 'circle');
  const $botLDot  = document.createElementNS(svgns, 'circle');
  const $topRDot  = document.createElementNS(svgns, 'circle');
  const $botRDot  = document.createElementNS(svgns, 'circle');
  const $dots     = [$topLDot, $botLDot, $topRDot, $botRDot];
  const diameter  = scale(node, LENGTHS_IN_PX.dotDiameter);

  for (let $dot of $dots) {
    $dot.setSVGAttrs({
      'data-type':      'dot',
      'data-id':        node._id,
      transform:        node.props.transform,
      r:                diameter / 2,
    });
  }

  $topLDot.setSVGAttrs({
    cx: node.box.x - diameter,
    cy: node.box.y - diameter,
  });

  $botLDot.setSVGAttrs({
    cx: node.box.x - diameter,
    cy: node.box.y + node.box.height + diameter,
  });

  $topRDot.setSVGAttrs({
    cx: node.box.x + node.box.width + diameter,
    cy: node.box.y - diameter,
  });

  $botRDot.setSVGAttrs({
    cx: node.box.x + node.box.width + diameter,
    cy: node.box.y + node.box.height + diameter,
  });

  return $dots;
};

const frame = (node) => {
  const $frame = document.createElementNS(svgns, 'rect');

  $frame.setSVGAttrs({
    'data-type':  'frame',
    x:            node.box.x,
    y:            node.box.y,
    width:        node.box.width,
    height:       node.box.height,
    transform:    node.props.transform,
    'data-id':    node._id,
  });

  return $frame;
};

const innerUI = (node) => {
  const $innerUI = document.createElementNS(svgns, 'g');

  $innerUI.setSVGAttrs({
    'data-type': 'innerUI',
    'data-id':   node._id,
  });

  const $controls = controls(node);

  for (let $control of $controls) {
    $innerUI.appendChild($control);
  }

  return $innerUI;
};

const controls = (node) => {
  const $controls = [];
  const diameter  = scale(node, LENGTHS_IN_PX.controlDiameter);

  for (let spline of node.path) {
    for (let segment of spline) {

      $controls.push(control(node, diameter, segment.anchor.x, segment.anchor.y));

      if (segment.handleIn) {
        $controls.push(control(node, diameter, segment.handleIn.x, segment.handleIn.y));
      }

      if (segment.handleOut) {
        $controls.push(control(node, diameter, segment.handleOut.x, segment.handleOut.y));
      }
    }
  }

  return $controls;
};

const control = (node, diameter, x, y) => {
  const $control = document.createElementNS(svgns, 'circle');

  $control.setSVGAttrs({
    'data-type': 'control',
    'data-id':   control._id,
    transform:   node.props.transform,
    r:           diameter / 2,
    cx:          x,
    cy:          y,
  });

  return $control;
}

export { sceneRenderer };

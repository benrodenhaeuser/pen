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
  dotDiameter:      18,
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

    $node.setSVGAttrs(node.attr);          // copy all the attributes
    $node.setSVGAttr('data-id', node._id); // every node has an id

    if (node.tag === 'svg') {
      $node.setAttributeNS(xmlns, 'xmlns', svgns);
      $node.setSVGAttr('data-type', 'root');

      $parent.appendChild($node);

      this.documentScale = this.canvasWidth / node.viewBox.width;
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
  const $dots    = dots(node);    // rotation
  const $corners = corners(node); // scaling

  $outerUI.appendChild($frame);
  for (let dot of $dots) {
    $outerUI.appendChild(dot);
  }

  for (let corner of $corners) {
    $outerUI.appendChild(corner);
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
      transform:   node.attr.transform,
      width:       length,
      height:      length,
    });
  }

  $topLCorner.setSVGAttrs({
    x: node.bounds.x - length / 2,
    y: node.bounds.y - length / 2,
  });

  $botLCorner.setSVGAttrs({
    x: node.bounds.x - length / 2,
    y: node.bounds.y + node.bounds.height - length / 2,
  });

  $topRCorner.setSVGAttrs({
    x: node.bounds.x + node.bounds.width - length / 2,
    y: node.bounds.y - length / 2,
  });

  $botRCorner.setSVGAttrs({
    x: node.bounds.x + node.bounds.width - length / 2,
    y: node.bounds.y + node.bounds.height - length / 2,
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
  const radius    = diameter / 2;

  for (let $dot of $dots) {
    $dot.setSVGAttrs({
      'data-type':      'dot',
      'data-id':        node._id,
      transform:        node.attr.transform,
      r:                radius,
    });
  }

  $topLDot.setSVGAttrs({
    cx: node.bounds.x - radius / 2,
    cy: node.bounds.y - radius / 2,
  });

  $botLDot.setSVGAttrs({
    cx: node.bounds.x - radius / 2,
    cy: node.bounds.y + node.bounds.height + radius / 2,
  });

  $topRDot.setSVGAttrs({
    cx: node.bounds.x + node.bounds.width + radius / 2,
    cy: node.bounds.y - radius / 2,
  });

  $botRDot.setSVGAttrs({
    cx: node.bounds.x + node.bounds.width + radius / 2,
    cy: node.bounds.y + node.bounds.height + radius / 2,
  });

  return $dots;
};

const frame = (node) => {
  const $frame = document.createElementNS(svgns, 'rect');

  $frame.setSVGAttrs({
    'data-type':  'frame',
    x:            node.bounds.x,
    y:            node.bounds.y,
    width:        node.bounds.width,
    height:       node.bounds.height,
    transform:    node.attr.transform,
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

  console.log(diameter);

  console.log('node.path', node.path); // TODO: flat array -- why is that?

  for (let spline of node.path) {
    console.log(spline);
    for (let segment of spline) {
      console.log(segment);

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
    transform:   node.attr.transform,
    r:           diameter / 2,
    cx:          x,
    cy:          y,
  });

  return $control;
}

export { sceneRenderer };

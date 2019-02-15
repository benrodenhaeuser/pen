const svgns = 'http://www.w3.org/2000/svg';
const xmlns = 'http://www.w3.org/2000/xmlns/';

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

const wrap = ($node, node) => {
  const wrapper    = document.createElementNS(svgns, 'g');
  const chrome     = document.createElementNS(svgns, 'g');
  const frame      = document.createElementNS(svgns, 'rect');
  const topLCorner = document.createElementNS(svgns, 'rect');
  const botLCorner = document.createElementNS(svgns, 'rect');
  const topRCorner = document.createElementNS(svgns, 'rect');
  const botRCorner = document.createElementNS(svgns, 'rect');
  const topLDot    = document.createElementNS(svgns, 'circle');
  const botLDot    = document.createElementNS(svgns, 'circle');
  const topRDot    = document.createElementNS(svgns, 'circle');
  const botRDot    = document.createElementNS(svgns, 'circle');
  const corners    = [topLCorner, botLCorner, topRCorner, botRCorner];
  const dots       = [topLDot,    botLDot,    topRDot,    botRDot];

  const width     = node.box.width;
  const height    = node.box.height;
  const x         = node.box.x;
  const y         = node.box.y;
  const transform = node.props.transform;
  const id        = node._id;

  $node.setSVGAttrs({
    'data-type': 'content',
    'pointer-events': 'none',
  });

  wrapper.setSVGAttrs({
    'data-type':      'wrapper',
    'pointer-events': 'bounding-box',
    'data-id':        id,
  });

  chrome.setSVGAttrs({
    'data-type': 'chrome',
    'data-id': id,
    'pointer-events': 'visiblePainted',
    'visibility': 'hidden',
  });

  frame.setSVGAttrs({
    'data-type':      'frame',
    x:                 x,
    y:                 y,
    width:             width,
    height:            height,
    stroke:            '#d3d3d3',
    'vector-effect':  'non-scaling-stroke',
    'stroke-width':   '1px',
    transform:         transform,            // the frame should be transformed
    fill:             'none',
    'pointer-events': 'none',
    'data-id':        id,
  });

  for (let corner of corners) {
    corner.setSVGAttrs({
      'data-type':     'corner',
      'data-id':       id,
      transform:       transform,
      width:           8,
      height:          8,
      stroke:          '#d3d3d3',
      'vector-effect': 'non-scaling-stroke',
      'stroke-width':  '1px',
      fill:            '#FFFFFF',
    });
  }

  topLCorner.setSVGAttrs({ x: x - 4,         y: y - 4          });
  botLCorner.setSVGAttrs({ x: x - 4,         y: y + height - 4 });
  topRCorner.setSVGAttrs({ x: x + width - 4, y: y - 4          });
  botRCorner.setSVGAttrs({ x: x + width - 4, y: y + height - 4 });

  for (let dot of dots) {
    dot.setSVGAttrs({
      'data-type':     'dot',
      'data-id':       id,
      transform:       transform,
      r:               5,
      stroke:          '#d3d3d3',
      'vector-effect': 'non-scaling-stroke',
      'stroke-width':  '1px',
      fill:            '#FFFFFF',
    });
  }

  topLDot.setSVGAttrs({ cx: x - 8,         cy: y - 8          });
  botLDot.setSVGAttrs({ cx: x - 8,         cy: y + height + 8 });
  topRDot.setSVGAttrs({ cx: x + width + 8, cy: y - 8          });
  botRDot.setSVGAttrs({ cx: x + width + 8, cy: y + height + 8 });

  wrapper.appendChild($node);
  wrapper.appendChild(chrome);
  chrome.appendChild(frame);
  for (let corner of corners) {
    chrome.appendChild(corner);
  }
  for (let dot of dots) {
    chrome.appendChild(dot);
  }

  return wrapper;
};


// TODO: need to take care of style and defs

const sceneRenderer = {
  render(scene, $canvas) {
    canvas.innerHTML = '';
    this.build(scene, $canvas);
  },

  build(node, $parent) {
    const $node = document.createElementNS(svgns, node.tag);
    $node.setSVGAttrs(node.props);
    $node.setSVGAttr('data-id', node._id);

    if (node.tag === 'svg') {
      $node.setAttributeNS(xmlns, 'xmlns', svgns);
      $node.setAttributeNS(svgns, 'data-type', 'root');
      $parent.appendChild($node);
    } else {
      const $wrapper = wrap($node, node);
      $parent.appendChild($wrapper);
    }

    for (let child of node.children) {
      sceneRenderer.build(child, $node);
    }
  },
};

export { sceneRenderer };


// Need to reorganize this in such a way that we have access to the pair ($node, node) throughout

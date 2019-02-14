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
  const corners    = [topLCorner, botLCorner, topRCorner, botRCorner];

  const width     = node.coords.width;
  const height    = node.coords.height;
  const x         = node.coords.x;
  const y         = node.coords.y;
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
    x:                 x,                    // alternative:
    y:                 y,                    // get the bounding box
    width:             width,                // of the wrapper here
    height:            height,               
    stroke:            '#d3d3d3',
    'vector-effect':  'non-scaling-stroke',
    'stroke-width':   '1px',
    transform:         transform,
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

  wrapper.appendChild($node);
  wrapper.appendChild(chrome);
  chrome.appendChild(frame);
  for (let corner of corners) {
    chrome.appendChild(corner);
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

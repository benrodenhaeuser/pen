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

const wrap = (element) => {
  const parent         = element.parentNode;
  const wrapper        = document.createElementNS(svgns, 'g');
  const chrome         = document.createElementNS(svgns, 'g');
  const frame          = document.createElementNS(svgns, 'rect');
  const topLeftCorner  = document.createElementNS(svgns, 'rect');
  const botLeftCorner  = document.createElementNS(svgns, 'rect');
  const topRightCorner = document.createElementNS(svgns, 'rect');
  const botRightCorner = document.createElementNS(svgns, 'rect');

  wrapper.appendChild(element);
  parent.appendChild(wrapper);

  const bb             = wrapper.getBBox();
  const width          = bb.width;
  const height         = bb.height;
  const x              = bb.x;
  const y              = bb.y;
  const id             = element.getSVGAttr('data-id');
  const corners        = [
    topLeftCorner, botLeftCorner, topRightCorner, botRightCorner
  ];

  wrapper.appendChild(chrome);
  chrome.appendChild(frame);
  for (let corner of corners) {
    chrome.appendChild(corner);
  }

  element.setSVGAttrs({
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
    fill:             'none',
    'pointer-events': 'none',
    'data-id':        id,
  });

  topLeftCorner.setSVGAttrs({
    'data-type': 'top-left-corner',
    x: x - 2,
    y: y - 2,
  });

  botLeftCorner.setSVGAttrs({
    'data-type': 'bot-left-corner',
    x: x - 2,
    y: y + height - 2,
  });

  topRightCorner.setSVGAttrs({
    'data-type': 'top-right-corner',
    x: x + width - 2,
    y: y - 2,
  });

  botRightCorner.setSVGAttrs({
    'data-type': 'bot-right-corner',
    x: x + width - 2,
    y: y + height - 2,
  });

  for (let corner of corners) {
    corner.setSVGAttrs({
      'data-id': id,
      width: 4,
      height: 4,
      stroke: '#d3d3d3',
      'vector-effect': 'non-scaling-stroke',
      'stroke-width': '1px',
      fill: '#FFFFFF',
    });
  }

  return wrapper;
};


// TODO: need to take care of style and defs

// This recreates the original svg from our scene tree:
// TODO: need to wrap nodes. for this to make sense,
// the leaf nodes need to have been rendered.
const sceneRenderer = {
  build(scene, $parent) {
    const $node = document.createElementNS(svgns, scene.tag);

    $node.setSVGAttrs(scene.props);
    $node.setSVGAttr('data-id', scene._id);

    if (scene.tag === 'svg') {
      // console.log('styles', scene.styles); // TODO: undefined
      $node.setAttributeNS(xmlns, 'xmlns', svgns);
      $node.setAttributeNS(svgns, 'data-type', 'root');
      // $node.setSVGAttr('viewBox', '-100 -100 400 400'); // for 48k
    }

    $parent.appendChild($node);

    for (let child of scene.children) {
      sceneRenderer.build(child, $node);
    }

    return $node;
  },

  decorate($node) {
    if ($node.tagName !== 'svg') {
      wrap($node);
    }

    const $children = Array.from($node.children);
    // ^ don't iterate over $node.children directly!
    // this results in an infinite loop, because
    // it's a *live* collection!

    for (let $child of $children) {
      sceneRenderer.decorate($child);
    }
  },
};

export { sceneRenderer };

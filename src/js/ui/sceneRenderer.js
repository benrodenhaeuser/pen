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
  const parent     = element.parentNode;
  const wrapper    = document.createElementNS(svgns, 'g');
  const chrome     = document.createElementNS(svgns, 'g');
  const frame      = document.createElementNS(svgns, 'rect');
  const topLCorner = document.createElementNS(svgns, 'rect');
  const botLCorner = document.createElementNS(svgns, 'rect');
  const topRCorner = document.createElementNS(svgns, 'rect');
  const botRCorner = document.createElementNS(svgns, 'rect');

  wrapper.appendChild(element);
  parent.appendChild(wrapper);

  const bb      = wrapper.getBBox();
  const width   = bb.width;
  const height  = bb.height;
  const x       = bb.x;
  const y       = bb.y;
  const id      = element.getSVGAttr('data-id');
  const corners = [topLCorner, botLCorner, topRCorner, botRCorner];

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
    // ^ use initial bounding box given by coords here
    //   apply current transform on element
    stroke:            '#d3d3d3',
    'vector-effect':  'non-scaling-stroke',
    'stroke-width':   '1px',
    fill:             'none',
    'pointer-events': 'none',
    'data-id':        id,
  });

  for (let corner of corners) {
    corner.setSVGAttrs({
      'data-type': 'corner',
      'data-id': id,
      width: 8,
      height: 8,
      stroke: '#d3d3d3',
      'vector-effect': 'non-scaling-stroke',
      'stroke-width': '1px',
      fill: '#FFFFFF',
    });
  }

  topLCorner.setSVGAttrs({ x: x - 4,         y: y - 4          });
  botLCorner.setSVGAttrs({ x: x - 4,         y: y + height - 4 });
  topRCorner.setSVGAttrs({ x: x + width - 4, y: y - 4          });
  botRCorner.setSVGAttrs({ x: x + width - 4, y: y + height - 4 });

  return wrapper;
};


// TODO: need to take care of style and defs

// Recreate SVG DOM from scene tree.

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


// Need to reorganize this in such a way that we have access to the pair ($node, node) throughout

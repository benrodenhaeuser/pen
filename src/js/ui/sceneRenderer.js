const svgns = 'http://www.w3.org/2000/svg';
const xmlns = 'http://www.w3.org/2000/xmlns/';

// TODO: put in a utility module somewhere?
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

// TODO: need to take care of style and defs
const sceneRenderer = {
  render(scene, $canvas) {
    canvas.innerHTML = '';
    this.build(scene, $canvas);
  },

  build(node, $parent) {
    const $node = document.createElementNS(svgns, node.tag);

    if (node.path) {
      node.props.d = encodeAsSVGPath(node.path);
    }

    // TODO: we will also need node.path elsewhere

    $node.setSVGAttrs(node.props);
    $node.setSVGAttr('data-id', node._id);

    if (node.tag === 'svg') {
      $node.setAttributeNS(xmlns, 'xmlns', svgns);
      $node.setAttributeNS(svgns, 'data-type', 'root');
      $parent.appendChild($node);
      const viewBoxWidth = Number(node.props.viewBox.split(' ')[2]);
      this.documentScale = this.canvasWidth / viewBoxWidth;
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

const encodeAsSVGPath = (path) => {
  let d = '';

  for (let segment of path) {
    if (segment.type === 'move') {
      d += 'M ';
    } else if (segment.controls.length === 1) {
      d += 'L '
    } else if (segment.controls.length === 2) {
      d += 'Q '
    } else if (segment.controls.length === 3) {
      d += 'C '
    }

    for (let control of segment.controls) {
      d += String(control.x) + ' ' + String(control.y) + ' ';
    }
  }

  return d;
};

const antiScale = (node, length) => {
  return length / (node.globalScale * sceneRenderer.documentScale);
};

const wrap = ($node, node) => {
  const $wrapper       = document.createElementNS(svgns, 'g');
  const $chrome        = document.createElementNS(svgns, 'g');
  const $frame         = document.createElementNS(svgns, 'rect');
  const topLCorner     = document.createElementNS(svgns, 'rect');
  const botLCorner     = document.createElementNS(svgns, 'rect');
  const topRCorner     = document.createElementNS(svgns, 'rect');
  const botRCorner     = document.createElementNS(svgns, 'rect');
  const topLDot        = document.createElementNS(svgns, 'circle');
  const botLDot        = document.createElementNS(svgns, 'circle');
  const topRDot        = document.createElementNS(svgns, 'circle');
  const botRDot        = document.createElementNS(svgns, 'circle');
  const corners        = [topLCorner, botLCorner, topRCorner, botRCorner];
  const dots           = [topLDot,    botLDot,    topRDot,    botRDot];
  const width          = node.box.width;
  const height         = node.box.height;
  const x              = node.box.x;
  const y              = node.box.y;
  const transform      = node.props.transform;
  const id             = node._id;
  const baseSideLength = 8;
  const baseDiameter   = 9;
  const sideLength     = antiScale(node, baseSideLength);
  const diameter       = antiScale(node, baseDiameter);
  const radius         = diameter / 2;

  $node.setSVGAttrs({
    'data-type': 'content',
  });

  $wrapper.setSVGAttrs({
    'data-type':      'wrapper',
    'data-id':        id,
  });

  $chrome.setSVGAttrs({
    'data-type': 'chrome',
    'data-id': id,
  });

  $frame.setSVGAttrs({
    'data-type':      'frame',
    x:                x,
    y:                y,
    width:            width,
    height:           height,
    transform:        transform,
    'data-id':        id,
  });

  for (let corner of corners) {
    corner.setSVGAttrs({
      'data-type':     'corner',
      'data-id':       id,
      transform:       transform,
      width:           sideLength,
      height:          sideLength,
    });
  }

  topLCorner.setSVGAttrs({
    x: x - sideLength / 2,
    y: y - sideLength / 2,
  });

  botLCorner.setSVGAttrs({
    x: x - sideLength / 2,
    y: y + height - sideLength / 2,
  });

  topRCorner.setSVGAttrs({
    x: x + width - sideLength / 2,
    y: y - sideLength / 2,
  });

  botRCorner.setSVGAttrs({
    x: x + width - sideLength / 2,
    y: y + height - sideLength / 2,
  });

  for (let dot of dots) {
    dot.setSVGAttrs({
      'data-type':      'dot',
      'data-id':        id,
      transform:        transform,
      r:                radius,
    });
  }

  topLDot.setSVGAttrs({
    cx: x - diameter,
    cy: y - diameter,
  });

  botLDot.setSVGAttrs({
    cx: x - diameter,
    cy: y + height + diameter,
  });

  topRDot.setSVGAttrs({
    cx: x + width + diameter,
    cy: y - diameter,
  });

  botRDot.setSVGAttrs({
    cx: x + width + diameter,
    cy: y + height + diameter,
  });

  $chrome.appendChild($frame);
  for (let corner of corners) {
    $chrome.appendChild(corner);
  }
  for (let dot of dots) {
    $chrome.appendChild(dot);
  }

  $wrapper.appendChild($node);
  $wrapper.appendChild($chrome);

  // TODO: improve organization
  if (node.path) {
    for (let segment of node.path) {
        for (let control of segment.controls) {
          const $handle = document.createElementNS(svgns, 'circle');
          $handle.setSVGAttrs({
            'data-type': 'handle',
            'data-id':   control._id,
            transform:   transform,
            r:           radius,
            cx:          control.x,
            cy:          control.y,
            fill:        'black',
            stroke:      '#5DADE2',
          });
          $chrome.appendChild($handle);
        }
    }
  }

  return $wrapper;
};

export { sceneRenderer };

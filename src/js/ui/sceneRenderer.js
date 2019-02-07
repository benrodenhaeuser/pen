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

//   return this.setAttributeNS.apply(this, [null].concat(args));
// };
//
// const setSVGAttrs = (element, obj) => {
//
// };

// TODO: need to take care of style and defs
// I think they are eliminated when stringifying the state object

// TODO: wrap nodes from original svg
const sceneRenderer = {
  build(scene, $parent) {
    const $node = document.createElementNS(svgns, scene.tag);

    if (scene.tag === 'svg') {
      $node.setAttributeNS(xmlns, 'xmlns', svgns);
    }

    $node.setSVGAttrs(scene.props);
    $parent.appendChild($node);

    for (let child of scene.children) {
      sceneRenderer.build(child, $node);
    }
  },
};

export { sceneRenderer };

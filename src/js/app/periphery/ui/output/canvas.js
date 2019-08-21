import { UIDevice } from '../uiDevice.js';

const svgns = 'http://www.w3.org/2000/svg';
const xmlns = 'http://www.w3.org/2000/xmlns/';

const canvas = Object.assign(Object.create(UIDevice), {
  init() {
    this.name = 'canvas';
    UIDevice.init.bind(this)();
    return this;
  },

  createElement(vNode) {
    if (typeof vNode === 'string') {
      return document.createTextNode(vNode);
    }

    const $node = document.createElementNS(svgns, vNode.tag);

    for (let [key, value] of Object.entries(vNode.props)) {
      if (key === 'xmlns') {
        $node.setAttributeNS(xmlns, key, value);
      } else if (value) {
        $node.setAttributeNS(null, key, value);
      }
    }

    for (let vChild of vNode.children) {
      $node.appendChild(this.createElement(vChild));
    }

    return $node;
  },

  coordinates(event) {
    const coords = {};

    const svg = document.querySelector('svg');

    if (svg) {
      let point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      point = point.matrixTransform(svg.getScreenCTM().inverse());
      coords.x = point.x;
      coords.y = point.y;
    }

    return coords;
  },
});

export { canvas };

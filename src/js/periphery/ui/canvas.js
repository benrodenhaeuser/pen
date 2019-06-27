import { UI } from './ui.js';

const svgns  = 'http://www.w3.org/2000/svg';
const xmlns  = 'http://www.w3.org/2000/xmlns/';

const canvas = Object.assign(Object.create(UI), {
  init(state) {
    this.name = 'canvas';
    UI.init.bind(this)(state);
    return this;
  },

  bindEvents(func) {
    const mouseEvents = ['mousedown', 'mousemove', 'mouseup', 'click', 'dblclick'];

    for (let eventType of mouseEvents) {
      this.mountPoint.addEventListener(eventType, (event) => {
        if (this.clickLike(event) && event.detail > 1) {
          return;
        }

        if (event.type === 'mousedown') {
          document.querySelector('textarea').blur();
        }

        event.preventDefault();

        func({
          source: this.name,
          type:   event.type,
          target: event.target.dataset.type,
          key:    event.target.dataset.key,
          x:      this.coordinates(event).x,
          y:      this.coordinates(event).y,
        });
      });
    }
  },

  createElement(vNode) {
    if (typeof vNode === 'string') {
      return document.createTextNode(vNode);
    }

    const $node = document.createElementNS(svgns, vNode.tag);

    for (let [key, value] of Object.entries(vNode.props)) {
      if (key === 'xmlns') {
        $node.setAttributeNS(xmlns, key, value);
      } else {
        $node.setAttributeNS(null, key, value);
      }
    }

    for (let vChild of vNode.children) {
      $node.appendChild(this.createElement(vChild));
    }

    return $node;
  },

  clickLike(event) {
    return event.type === 'click' ||
           event.type === 'mousedown' ||
           event.type === 'mouseup';
  },

  coordinates(event) {
    const coords = {};

    const svg = document.querySelector('svg');

    if (svg) {
      let point   = svg.createSVGPoint();
      point.x     = event.clientX;
      point.y     = event.clientY;
      point       = point.matrixTransform(svg.getScreenCTM().inverse());
      coords.x    = point.x;
      coords.y    = point.y;
    }

    return coords;
  },
});

export { canvas };

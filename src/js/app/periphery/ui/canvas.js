import { UIModule } from './uiModule.js';

const svgns = 'http://www.w3.org/2000/svg';
const xmlns = 'http://www.w3.org/2000/xmlns/';

const canvas = Object.assign(Object.create(UIModule), {
  init(snapshot) {
    this.name = 'canvas';
    UIModule.init.bind(this)(snapshot);
    return this;
  },

  bindEvents(func) {
    let requestID;

    this.mountPoint.addEventListener('mousemove', event => {
      event.preventDefault();

      if (requestID) {
        cancelAnimationFrame(requestID);
      }

      requestID = requestAnimationFrame(() => {
        this.makeInput(func, event);
        requestID = null;
      })
    });

    for (let eventType of ['click', 'mousedown', 'mouseup']) {
      this.mountPoint.addEventListener(eventType, event => {
        if (event.detail > 1) {
          event.stopPropagation();
          return;
        }

        // TODO: ugly
        if (event.type === 'mousedown') {
          const textarea = document.querySelector('textarea');
          if (textarea) {
            textarea.blur();
          }
        }

        event.preventDefault();
        this.makeInput(func, event);
      });
    }

    for (let eventType of ['dblclick', 'mouseout']) {
      this.mountPoint.addEventListener(eventType, event => {
        event.preventDefault();
        this.makeInput(func, event);
      });
    }
  },

  makeInput(func, event) {
    func({
      source: this.name,
      type: event.type,
      target: event.target.dataset.type,
      key: event.target.dataset.key,
      x: this.coordinates(event).x,
      y: this.coordinates(event).y,
    });
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

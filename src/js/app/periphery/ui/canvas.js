import { UIModule } from './uiModule.js';

const svgns = 'http://www.w3.org/2000/svg';
const xmlns = 'http://www.w3.org/2000/xmlns/';

const canvas = Object.assign(Object.create(UIModule), {
  init() {
    this.name = 'canvas';
    UIModule.init.bind(this)();
    return this;
  },

  bindEvents(func) {
    this.bindMouseButtonEvents(func);
    this.bindMouseMoveEvents(func);
  },

  bindMouseButtonEvents(func) {
    const eventTypes = ['click', 'dblclick', 'mousedown', 'mouseup', 'mouseout'];

    for (let eventType of eventTypes) {
      const input = {
        source: this.name,
        type: eventType,
      };

      this.mountPoint.addEventListener(eventType, event => {
        if (['click', 'mousedown', 'mouseup'].includes(eventType) && event.detail > 1) {
          event.stopPropagation();
          return;
        }

        const textarea = document.querySelector('textarea');
        textarea && textarea.blur();
        event.preventDefault();

        Object.assign(input, {
          target: event.target.dataset.type,
          key: event.target.dataset.key,
          x: this.coordinates(event).x,
          y: this.coordinates(event).y,
        });

        func(input);
      });
    }
  },

  bindMouseMoveEvents(func) {
    const input = {
      source: this.name,
      type: 'mousemove',
    };

    const old = {};

    this.mountPoint.addEventListener('mousemove', event => {
      event.preventDefault();

      Object.assign(input, {
        target: event.target.dataset.type,
        key: event.target.dataset.key,
        x: this.coordinates(event).x,
        y: this.coordinates(event).y,
      });
    });

    const mouseMove = () => {
      requestAnimationFrame(mouseMove);

      if (input.x !== old.x || input.y !== old.y) {
        func(input);
      }

      old.x = input.x;
      old.y = input.y;
    }

    requestAnimationFrame(mouseMove);
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

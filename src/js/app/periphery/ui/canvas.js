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
    const mouseEvents = [
      'mousedown',
      'mouseup',
      'mouseout',
      'click',
      'dblclick',
    ];

    const clickLike = [
      'click',
      'mousedown',
      'mouseup'
    ];

    for (let eventType of mouseEvents) {
      this.mountPoint.addEventListener(eventType, event => {
        if (clickLike.includes(event.type) && event.detail > 1) {
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

        func({
          source: this.name,
          type: event.type,
          target: event.target.dataset.type,
          key: event.target.dataset.key,
          x: this.coordinates(event).x,
          y: this.coordinates(event).y,
        });
      });
    }

    let lastUpdateCall; // TODO: naming

    this.mountPoint.addEventListener('mousemove', event => {
      event.preventDefault();

      if (lastUpdateCall) {
        cancelAnimationFrame(lastUpdateCall);
      }

      lastUpdateCall = requestAnimationFrame(() => {
        func({
          source: this.name,
          type: event.type,
          target: event.target.dataset.type,
          key: event.target.dataset.key,
          x: this.coordinates(event).x,
          y: this.coordinates(event).y,
        });
        lastUpdateCall = null;
      })
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

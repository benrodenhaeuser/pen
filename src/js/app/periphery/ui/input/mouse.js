import { resize } from '../helpers/resize.js';

const mouse = {
  init() {
    this.name = 'mouse';
    this.mountPoint = document.querySelector('#canvas');
    return this;
  },

  bindEvents(func) {
    this.bindMouseButtonEvents(func);
    this.bindMouseMoveEvents(func);
    this.bindViewportEvents(func);
  },

  bindViewportEvents(func) {
    window.onresize = () => resize(func, this.name);
  },

  bindMouseButtonEvents(func) {
    const eventTypes = [
      'click',
      'dblclick',
      'mousedown',
      'mouseup',
      'mouseout',
    ];

    for (let eventType of eventTypes) {
      const input = {
        source: this.name,
        type: eventType,
      };

      this.mountPoint.addEventListener(eventType, event => {
        if (
          ['click', 'mousedown', 'mouseup'].includes(eventType) &&
          event.detail > 1
        ) {
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
    };

    requestAnimationFrame(mouseMove);
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
};

export { mouse };

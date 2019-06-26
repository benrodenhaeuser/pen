import { UIComponent } from '../ui.js';

const svgns       = 'http://www.w3.org/2000/svg';
const xmlns       = 'http://www.w3.org/2000/xmlns/';
const mouseEvents = ['mousedown', 'mousemove', 'mouseup', 'click', 'dblclick'];

const canvas = Object.create(UIComponent);

Object.assign(canvas, {
  init() {
    this.name = 'canvas'; // TODO: not sure if this works
    return this;
  },

  bindEvents(func) {
    for (let eventType of mouseEvents) {
      document.addEventListener(eventType, (event) => {
        if (this.clickLike(event) && event.detail > 1) {
          return;
        }

        event.preventDefault();

        func({
          source: this.name,
          type:   event.type,
          target: event.target.dataset.type,
          value:  event.target.value,
          key:    event.target.dataset.key,
          x:      this.coordinates(event).x,
          y:      this.coordinates(event).y,
        });
      });
    }
  },

  createElement(vNode) {
    if (typeof vNode === 'string') {
      const tNode = document.createTextNode(vNode);
      return tNode;
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

  reconcile(oldVNode, newVNode, $node) {
    if (typeof newVNode === 'string' && newVNode !== oldVNode) {
      $node.replaceWith(this.createElement(newVNode));
    } else if (oldVNode.tag !== newVNode.tag) {
      $node.replaceWith(this.createElement(newVNode));
    } else {
      this.reconcileProps(oldVNode, newVNode, $node);
      this.reconcileChildren(oldVNode, newVNode, $node);
    }
  },

  clickLike(event) {
    return event.type === 'click' || event.type === 'mousedown' || event.type === 'mouseup';
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

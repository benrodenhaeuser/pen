const svgTags = [
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'line'
];

const eventTypes = [
  'mousedown',
  'mousemove',
  'mouseup',
  'click',
  'dblclick'
];

const svgns   = 'http://www.w3.org/2000/svg';
const xmlns   = 'http://www.w3.org/2000/xmlns/';
const htmlns  = 'http://www.w3.org/1999/xhtml';

const ui = {
  init() {
    this.name = 'ui';
  },

  bindEvents(func) {
    for (let eventType of eventTypes) {
      document.addEventListener(eventType, (event) => {
        event.preventDefault();

        if (event.type !== 'dblclick' && event.detail > 1) {
          return;
        }

        func({
          type:   event.type,
          target: event.target.dataset.type,
          key:    event.target.dataset.key,
          x:      this.coordinates(event).x,
          y:      this.coordinates(event).y,
        });
      });
    }
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

  receive(state) {
    if (state.label === 'start') {
      this.dom = this.createElement(state.vDOM);
      this.mount(this.dom, document.body);
    } else {
      this.reconcile(this.previousVDOM, state.vDOM, this.dom);
    }

    this.previousVDOM = state.vDOM;
  },

  mount($node, $mountPoint) {
    $mountPoint.innerHTML = '';
    $mountPoint.appendChild($node);
  },

  createElement(vNode) {
    if (typeof vNode === 'string') {
      return document.createTextNode(vNode);
    }

    let $node;

    if (svgTags.includes(vNode.tag)) {
      $node = document.createElementNS(svgns, vNode.tag);
    } else {
      $node = document.createElementNS(htmlns, vNode.tag);
    }

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
    if (typeof newVNode === 'string') {
      if (newVNode !== oldVNode) {
        $node.replaceWith(this.createElement(newVNode));
      }
    } else if (oldVNode.tag !== newVNode.tag) {
      $node.replaceWith(this.createElement(newVNode));
    }
     else {
      this.reconcileProps(oldVNode, newVNode, $node);
      this.reconcileChildren(oldVNode, newVNode, $node);
    }
  },

  reconcileProps(oldVNode, newVNode, $node) {
    for (let [key, value] of Object.entries(newVNode.props)) {
      if (oldVNode.props[key] !== newVNode.props[key]) {
        $node.setAttributeNS(null, key, value);
      }
    }

    for (let [key, value] of Object.entries(oldVNode.props)) {
      if (newVNode.props[key] === undefined) {
        $node.removeAttributeNS(null, key);
      }
    }
  },

  reconcileChildren(oldVNode, newVNode, $node) {
    const maxLength = Math.max(
      oldVNode.children.length,
      newVNode.children.length
    );

    for (let i = 0; i < maxLength; i += 1) {
      const oldVChild = oldVNode.children[i];
      const newVChild = newVNode.children[i];
      const $child    = $node.childNodes[i];

      if (newVChild === undefined) {
        $child && $child.remove();
      } else if (oldVChild === undefined) {
        $node.appendChild(this.createElement(newVChild));
      } else {
        this.reconcile(oldVChild, newVChild, $child);
      }
    }
  },
};

export { ui };

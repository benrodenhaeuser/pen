const svgTags = [
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'line'
];

const svgns   = 'http://www.w3.org/2000/svg';
const xmlns   = 'http://www.w3.org/2000/xmlns/';
const htmlns  = 'http://www.w3.org/1999/xhtml';

const ui = {
  init() {
    this.name = 'ui';
    return this;
  },

  bindEvents(func) {
    const mouseEvents = [
      'mousedown',
      'mousemove',
      'mouseup',
      'click',
      'dblclick',
    ];

    for (let eventType of mouseEvents) {
      document.addEventListener(eventType, (event) => {
        if (
          this.clickLike(event) &&
          (event.target.tagName === 'TEXTAREA' || event.detail > 1)
        ) {
          return;
        }

        // clicking outside textarea
        if (event.type === 'click') {
          document.querySelector('textarea').blur();
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

    document.addEventListener('input', (event) => {
      event.preventDefault();

      func({
        source: this.name,
        type:   event.type,
        value:  event.target.value,
      });
    });

    window.addEventListener('cleanMessage', (event) => {
      func({
        source: this.name,
        type:   'cleanMessage',
      });
    });
  },

  receive(state) {
    if (state.label === 'start') {
      this.dom = this.createElement(state.vDOM);
      this.mount(this.dom, document.body);
    } else {
      this.reconcile(this.previousVDOM, state.vDOM, this.dom);
    }

    this.previousVDOM = state.vDOM;

    this.setMessageTimer();
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

    // TODO: clean up this conditional.
    if (typeof newVNode === 'string') {
      if (newVNode !== oldVNode) {
        $node.replaceWith(this.createElement(newVNode));
      }
    } else if (newVNode.tag === 'textarea' && newVNode.props['data-key'] !== oldVNode.props['data-key']) {
      console.log('re-rendering textarea');
      // special case to correctly render textarea changes:
      $node.replaceWith(this.createElement(newVNode));
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

    let $index = 0;

    for (let vIndex = 0; vIndex < maxLength; vIndex += 1) {
      const oldVChild = oldVNode.children[vIndex];
      const newVChild = newVNode.children[vIndex];
      const $child    = $node.childNodes[$index];

      if (newVChild === undefined) {
        $child && $child.remove();
        $index -= 1;
      } else if (oldVChild === undefined) {
        $node.appendChild(this.createElement(newVChild));
      } else {
        this.reconcile(oldVChild, newVChild, $child);
      }

      $index += 1;
    }
  },

  setMessageTimer() {
    const msgNode = document.querySelector('#message');

    const cleanMessage = () => {
      window.dispatchEvent(new Event('cleanMessage'));
    };

    if (this.timer) {
      clearTimeout(this.timer);
    }

    // if there is a message being displayed ...
    if (msgNode && msgNode.innerHTML !== '') {
      // ... then delete the message after one second
      this.timer = window.setTimeout(cleanMessage, 1000);
    }
  },
};

export { ui };

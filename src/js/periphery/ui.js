const svgTags = ['svg', 'g', 'path', 'rect', 'circle', 'line'];

const svgns   = 'http://www.w3.org/2000/svg';
const xmlns   = 'http://www.w3.org/2000/xmlns/';
const htmlns  = 'http://www.w3.org/1999/xhtml';

const coordinates = (event) => {
  const svg = document.querySelector('svg');
  let point = svg.createSVGPoint();
  point.x   = event.clientX;
  point.y   = event.clientY;
  point     = point.matrixTransform(svg.getScreenCTM().inverse());

  return {
    x: point.x,
    y: point.y,
  };
};

const ui = {
  bindEvents(compute) {
    const eventTypes = [
      'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick'
    ];

    const shouldBeIgnored = (event) => {
      return [
        'mousedown', 'mouseup', 'click'
      ].includes(event.type) && event.detail > 1;
    };

    for (let eventType of eventTypes) {
      document.addEventListener(eventType, (event) => {
        event.preventDefault();

        if (shouldBeIgnored(event)) {
          return;
        }

        compute({
          type:   event.type,
          target: event.target.dataset.type,
          x:      coordinates(event).x,
          y:      coordinates(event).y,
          key:    event.target.dataset.key,
        });
      });
    }
  },

  // TODO: I am not sure if the `start` case shouldn't be handled elsewhere?
  sync(state) {
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
    let $node;

    if (svgTags.includes(vNode.tag)) {
      $node = document.createElementNS(svgns, vNode.tag);
    } else {
      $node = document.createElementNS(htmlns, vNode.tag);
    }

    console.log(vNode);

    for (let [key, value] of Object.entries(vNode.props)) {
      if (key === 'xmlns') {
        $node.setAttributeNS(xmlns, key, value);
      } else {
        $node.setAttributeNS(null, key, value);
      }
    }

    for (let vChild of vNode.children) {
      if (typeof vChild === 'string') {
        $node.appendChild(document.createTextNode(vChild));
      } else {
        $node.appendChild(this.createElement(vChild));
      }
    }

    return $node;
  },

  reconcile(oldV, newV, $node) {
    if (oldV.tag !== newV.tag) {
      $node.replaceWith(this.createElement(newV));
    } else {
      this.reconcileProps(oldV, newV, $node);
      this.reconcileChildren(oldV, newV, $node);
    }
  },

  reconcileProps(oldV, newV, $node) {
    for (let [key, value] of Object.entries(newV.props)) {
      if (oldV.props[key] !== newV.props[key]) {
        $node.setAttributeNS(null, key, value);
      }
    }

    for (let [key, value] of Object.entries(oldV.props)) {
      if (newV.props[key] === undefined) {
        $node.removeAttributeNS(null, key);
      }
    }
  },

  reconcileChildren(oldV, newV, $node) {
    const maxLength = Math.max(oldV.children.length, newV.children.length);
    for (let i = 0; i < maxLength; i += 1) {
      if (typeof newV.children[i] === 'string') {
        $node.childNodes[i].replaceWith(document.createTextNode(newV.children[i]));
        // ^ TODO: not sure if this is correct. what if there is no $node.childNodes[i]?
      } else if (newV.children[i] === undefined) {
        $node.childNodes[i] && $node.childNodes[i].remove();
      } else if (oldV.children[i] === undefined) {
        $node.appendChild(this.createElement(newV.children[i]));
      } else {
        this.reconcile(oldV.children[i], newV.children[i], $node.childNodes[i])
      }
    }
  },

  init() {
    this.name = 'ui';
  }
};

export { ui };

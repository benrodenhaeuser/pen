const UIDevice = {
  init() {
    this.mountPoint = document.querySelector(`#${this.name}`);
    const vDOM = this.requestSnapshot('vDOM')[this.name];
    this.dom = this.createElement(vDOM);
    this.previousVDOM = vDOM;

    this.mount();
  },

  mount() {
    this.mountPoint.innerHTML = '';
    this.mountPoint.appendChild(this.dom);
  },

  react(info) {
    const vDOM = this.requestSnapshot('vDOM')[this.name];
    this.reconcile(this.previousVDOM, vDOM, this.dom);
    this.previousVDOM = vDOM;
  },

  createElement(vNode) {
    if (typeof vNode === 'string') {
      return document.createTextNode(vNode);
    }

    const $node = document.createElement(vNode.tag);

    for (let [key, value] of Object.entries(vNode.props)) {
      $node.setAttribute(key, value);
    }

    for (let vChild of vNode.children) {
      $node.appendChild(this.createElement(vChild));
    }

    return $node;
  },

  reconcile(oldVNode, newVNode, $node) {
    // the magic clause:
    if (oldVNode === newVNode) {
      // console.log('strict equality applies');
      return;
    }

    if (typeof newVNode === 'string') {
      if (newVNode !== oldVNode) {
        $node.replaceWith(this.createElement(newVNode));
      }
    } else if (oldVNode.tag !== newVNode.tag) {
      $node.replaceWith(this.createElement(newVNode));
    } else {
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
      const $child = $node.childNodes[$index];

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
};

export { UIDevice };

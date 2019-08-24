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

  react(description) {
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
    this.patch(
      this.diff(oldVNode, newVNode, $node)
    );
  },

  diff(oldVNode, newVNode, $node, patches = []) {
    if (oldVNode !== newVNode) {
      if (typeof newVNode === 'string' || oldVNode.tag !== newVNode.tag) {
        patches.push(() => $node.replaceWith(this.createElement(newVNode)));
      } else {
        this.reconcileProps(oldVNode, newVNode, $node, patches);
        this.reconcileChildren(oldVNode, newVNode, $node, patches);
      }
    }

    return patches;
  },

  patch(patches) {
    for (let instruction of patches) {
      instruction();
    }
  },

  reconcileProps(oldVNode, newVNode, $node, patches) {
    for (let [key, value] of Object.entries(newVNode.props)) {
      if (oldVNode.props[key] !== newVNode.props[key]) {
        patches.push(() => $node.setAttributeNS(null, key, value));
      }
    }

    for (let [key, value] of Object.entries(oldVNode.props)) {
      if (newVNode.props[key] === undefined) {
        patches.push(() => $node.removeAttributeNS(null, key));
      }
    }
  },

  reconcileChildren(oldVNode, newVNode, $node, patches) {
    const maxLength = Math.max(
      oldVNode.children.length,
      newVNode.children.length
    );

    for (let i = 0; i < maxLength; i += 1) {
      const oldVChild = oldVNode.children[i];
      const newVChild = newVNode.children[i];
      const $child = $node.childNodes[i];

      if (newVChild === undefined) {
        $child && patches.push(() => $child.remove());
      } else if (oldVChild === undefined) {
        patches.push(() => $node.appendChild(this.createElement(newVChild)));
      } else {
        this.reconcile(oldVChild, newVChild, $child, patches);
      }
    }
  },
};

export { UIDevice };

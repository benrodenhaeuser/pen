const UIComponent = {
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
    // TODO: generic method here.
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
};

export { UIComponent };

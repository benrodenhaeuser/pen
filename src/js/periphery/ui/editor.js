import { UIComponent } from '../ui.js';

const editor = Object.assign(Object.create(UIComponent), {
  init() {
    this.name       = 'editor';
    this.mountPoint = document.querySelector('#editor');

    return this;
  },

  bindEvents(func) {
    this.mountPoint.addEventListener('input', (event) => {
      event.preventDefault();

      func({
        source: this.name,
        type:   event.type,
        value:  event.target.value,
      });
    });
  },

  reconcile(oldVNode, newVNode, $node) {
    if (
      $node.tagName === 'TEXTAREA' &&
      document.activeElement !== $node &&
      newVNode.children[0] !== oldVNode.children[0]
    ) {
      $node.value = newVNode.children[0];
    }
  },
});

export { editor };

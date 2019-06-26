import { UIComponent } from './ui.js';

const editor = Object.assign(Object.create(UIComponent), {
  init(state) {
    this.name       = 'editor';
    this.mountPoint = document.querySelector('#editor');

    // TODO: this should be encapsulated in a function
    this.dom = this.createElement(state.vDOM[this.name]);
    this.mount(this.dom, this.mountPoint);
    this.previousVDOM = state.vDOM[this.name];

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

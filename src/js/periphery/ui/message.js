import { UIComponent } from './ui.js';

const message = Object.assign(Object.create(UIComponent), {
  init(state) {
    this.name       = 'message';
    this.mountPoint = document.querySelector('#message');

    // TODO: this should be encapsulated in a function
    this.dom = this.createElement(state.vDOM[this.name]);
    this.mount(this.dom, this.mountPoint);
    this.previousVDOM = state.vDOM[this.name];

    return this;
  },

  bindEvents(func) {
    window.addEventListener('cleanMessage', (event) => {
      func({
        source: this.name,
        type:   'cleanMessage',
      });
    });
  },

  reconcile(oldVNode, newVNode, $node) {
    // if a timer has been set, clear it
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // if there is a new message, show it
    if (oldVNode !== newVNode) {
      $node.textContent = newVNode;
    }

    // if the message is non-empty, delete it after one second
    if (newVNode !== '') {
      this.timer = window.setTimeout(this.cleanMessage, 1000);
    }
  },

  cleanMessage() {
    window.dispatchEvent(new Event('cleanMessage'));
  },
});

export { message };
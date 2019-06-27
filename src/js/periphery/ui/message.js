import { UI } from './ui.js';

const message = Object.assign(Object.create(UI), {
  init(state) {
    this.name = 'message';
    UI.init.bind(this)(state);
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
    // if the message has changed, replace it
    if (oldVNode !== newVNode) {
      $node.textContent = newVNode;
    }

    // if a timer has been set earlier, clear it
    if (this.timer) {
      clearTimeout(this.timer);
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

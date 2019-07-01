import { UIModule } from './ui.js';

const message = Object.assign(Object.create(UIModule), {
  init(state) {
    this.name = 'message';
    UIModule.init.bind(this)(state);
    return this;
  },

  bindEvents(func) {
    window.addEventListener('wipeMessage', (event) => {
      func({
        source: this.name,
        type:   'wipeMessage',
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
      this.timer = window.setTimeout(this.wipeMessage, 1000);
    }
  },

  wipeMessage() {
    window.dispatchEvent(new Event('wipeMessage'));
  },
});

export { message };

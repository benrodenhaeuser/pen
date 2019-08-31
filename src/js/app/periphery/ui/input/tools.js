import { UIDevice } from '../uiDevice.js';

const tools = Object.assign(Object.create(UIDevice), {
  init() {
    this.name = 'tools';
    UIDevice.init.bind(this)();
    return this;
  },

  bindEvents(func) {
    this.mountPoint.addEventListener('click', event => {
      event.preventDefault();

      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.blur();
      }

      func({
        source: this.name,
        type: event.type,
        target: event.target.dataset.type,
        key: event.target.dataset.key,
      });
    });
  },
});

export { tools };

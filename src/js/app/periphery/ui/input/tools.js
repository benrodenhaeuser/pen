import { UIDevice } from '../helpers/uiDevice.js';
import { resize } from '../helpers/resize.js';

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

      if (event.target.dataset.type === 'docListButton') {
        resize(func, this.name);
      }
    });
  },
});

export { tools };

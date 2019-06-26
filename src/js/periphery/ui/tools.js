import { UIComponent } from '../ui.js';

const tools = Object.assign(Object.create(UIComponent), {
  init() {
    this.name       = 'tools';
    this.mountPoint = document.querySelector('#tools');

    return this;
  },

  bindEvents(func) {
    this.mountPoint.addEventListener('click', (event) => {
      event.preventDefault();
      document.querySelector('textarea').blur();

      func({
        source: this.name,
        type:   event.type,
        target: event.target.dataset.type,
        key:    event.target.dataset.key,
      });
    });
  },
});

export { tools };

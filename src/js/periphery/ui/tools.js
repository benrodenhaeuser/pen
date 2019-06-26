import { UIComponent } from './ui.js';

const tools = Object.assign(Object.create(UIComponent), {
  init(state) {
    this.name = 'tools';
    UIComponent.init.bind(this)(state);
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

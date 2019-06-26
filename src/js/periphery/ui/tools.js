import { UIComponent } from './ui.js';

const tools = Object.assign(Object.create(UIComponent), {
  init(state) {
    this.name       = 'tools';
    this.mountPoint = document.querySelector('#tools');

    // TODO: this should be encapsulated in a function
    this.dom = this.createElement(state.vDOM[this.name]);
    this.mount(this.dom, this.mountPoint);
    this.previousVDOM = state.vDOM[this.name];

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

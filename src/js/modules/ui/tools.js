import { UIModule } from './ui.js';

const tools = Object.assign(Object.create(UIModule), {
  init(state) {
    this.name = 'tools';
    UIModule.init.bind(this)(state);
    return this;
  },

  bindEvents(func) {
    this.mountPoint.addEventListener('click', (event) => {
      event.preventDefault();

      const textarea = document.querySelector('textarea')
      if (textarea) { textarea.blur(); }

      func({
        source: this.name,
        type:   event.type,
        target: event.target.dataset.type,
        key:    event.target.dataset.key,
      });
    });
  },

  // TODO: custom react function? only need to update documents (Open menu item)
});

export { tools };

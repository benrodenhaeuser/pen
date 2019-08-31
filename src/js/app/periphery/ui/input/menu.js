import { UIDevice } from '../uiDevice.js';

const menu = Object.assign(Object.create(UIDevice), {
  init() {
    this.name = 'menu';
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

  react(description) {
    if (description.menuVisible) {
      document.querySelector('main').classList.add('menu-expanded');
      const vDOM = this.requestSnapshot('vDOM')[this.name];
      this.reconcile(this.previousVDOM, vDOM, this.dom);
      this.previousVDOM = vDOM;
    } else {
      document.querySelector('main').classList.remove('menu-expanded');
    }
  },
});

export { menu };

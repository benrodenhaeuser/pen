const ESCAPE_CODE = 27;
const BACKSPACE_CODE = 8;

const keyboard = {
  init() {
    this.name = 'keyboard';
    return this;
  },

  bindEvents(func) {
    window.addEventListener('keydown', event => {
      if (event.keyCode === ESCAPE_CODE) {
        func({
          source: this.name,
          type: event.type,
          target: 'esc',
        });
      }
    });

    window.addEventListener('keydown', event => {
      if (event.keyCode === BACKSPACE_CODE) {
        func({
          source: this.name,
          type: event.type,
          target: 'delete',
        });
      }
    });
  },
};

export { keyboard };

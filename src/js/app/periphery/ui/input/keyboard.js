const ESCAPE_CODE = 27;
const BACKSPACE_CODE = 8;
const LETTER_C_CODE = 67;
const LETTER_V_CODE = 86;
const LETTER_S_CODE = 83;

const keyboard = {
  init() {
    this.name = 'keyboard';
    return this;
  },

  bindEvents(func) {
    window.addEventListener('keydown', event => {
      switch (event.keyCode) {
        case ESCAPE_CODE:
          func({
            source: this.name,
            type: event.type,
            target: 'esc',
          });
          break;
        case BACKSPACE_CODE:
          func({
            source: this.name,
            type: event.type,
            target: 'delete',
          });
          break;
        case LETTER_C_CODE:
          func({
            source: this.name,
            type: event.type,
            target: 'letterC',
          });
          break;
        case LETTER_V_CODE:
          func({
            source: this.name,
            type: event.type,
            target: 'letterV',
          });
          break;
        case LETTER_S_CODE:
          func({
            source: this.name,
            type: event.type,
            target: 'letterS',
          });
          break;
      }
    });
  },
};

export { keyboard };

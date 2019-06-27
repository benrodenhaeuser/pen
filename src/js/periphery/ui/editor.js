import { CodeMirror } from './codemirror/codemirror.js';

const editor = {
  init(state) {
    this.name       = 'editor';
    this.mountPoint = document.querySelector(`#editor`);
    this.editor     = CodeMirror(this.mountPoint, {
      lineNumbers: true,
      mode: 'xml', // TODO: not functional so far
      value: state.vDOM['editor'],
    });

    this.previousMarkup = state.vDOM['editor'];

    return this;
  },

  bindEvents(func) {
    this.editor.on('change', () => {
      if (this.editor.hasFocus()) {
        func({
          source: this.name,
          type:   'input',
          value:  this.editor.getValue(),
        });
      }
    });
  },

  react(state) {
    if (!this.editor.hasFocus() && state.vDOM['editor'] !== this.previousMarkup) {
      this.editor.getDoc().setValue(state.vDOM['editor']);
    }

    this.previousMarkup = state.vDOM['editor'];
  },
});

export { editor };

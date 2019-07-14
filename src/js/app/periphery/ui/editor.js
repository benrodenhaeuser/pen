import { CodeMirror } from '/vendor/codemirror/codemirror.js';

const editor = {
  init(state) {
    this.name       = 'editor';
    this.mountPoint = document.querySelector(`#editor`);
    this.editor     = CodeMirror(this.mountPoint, {
      lineNumbers:  true,
      lineWrapping: true,
      mode:         'xml',
      value:        state.parseTree.toMarkup(),
    });

    this.previousParseTree = state.parseTree;

    return this;
  },

  bindEvents(func) {
    this.editor.on('focus', () => {
      // if (this.textMarker) {
      //   this.textMarker.clear();
      // }
    });

    this.editor.on('change', () => {
      if (this.editor.hasFocus()) {
        func({
          source: this.name,
          type:   'markupChange',
          value:  this.editor.getValue(),
        });
      } else {
      }
    });

    this.editor.on('cursorActivity', () => {
      const cursorPosition = this.editor.getDoc().getCursor();
      const index = this.editor.getDoc().indexFromPos(cursorPosition);

      // an index of 0 is an indication that the event
      // was fired by programmatic text insertion
      if (index === 0) {
        return;
      }

      func({
        source: this.name,
        type: 'cursorSelect',
        index: index,
      });
    });
  },

  react(state) {
    const currentParseTree = state.parseTree;
    const previousParseTree = this.previousParseTree;

    if (['penMode', 'selectMode'].includes(state.label)) {
      if (!this.editor.hasFocus() && currentParseTree !== previousParseTree) {
        this.editor.getDoc().setValue(state.parseTree.toMarkup());
        // ^ TODO: replace with reconciliation mechanism
        // highlight markup corresponding to selected nodes
      }

      this.previousParseTree = state.parseTree;
    }
  },

  // TODO
  reconcile(oldANode, newANode, value) {

  },
};

export { editor };

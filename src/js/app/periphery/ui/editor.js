import { CodeMirror } from '/vendor/codemirror/codemirror.js';

const editor = {
  init(state) {
    this.name = 'editor';
    this.mountPoint = document.querySelector(`#editor`);
    this.editor = CodeMirror(this.mountPoint, {
      lineNumbers: true,
      lineWrapping: true,
      mode: 'xml',
      value: state.syntaxTree.toMarkup(),
    });

    this.previousSyntaxTree = state.syntaxTree;

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
          type: 'markupChange',
          value: this.editor.getValue(),
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
    const currentSyntaxTree = state.syntaxTree;
    const previousSyntaxTree = this.previousSyntaxTree;

    if (['penMode', 'selectMode'].includes(state.label) && !this.editor.hasFocus()) {
      this.editor.getDoc().setValue(state.syntaxTree.toMarkup());

      const node = state.syntaxTree.findNodeByClassName('selected');

      if (node) {
        const range = [node.start, node.end];

        console.log(range); // FINE

        // TODO: we need an array containing two codemirror position objects

        this.textMarker = this.editor.getDoc().markText(...range, { className: 'mark' });
      }

      this.previousSyntaxTree = state.syntaxTree;
    }
  },

  // TODO
  reconcile(oldANode, newANode, value) {},
};

export { editor };

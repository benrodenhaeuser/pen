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
    this.markupDoc = this.editor.getDoc();
    this.previousSyntaxTree = state.syntaxTree;

    return this;
  },

  bindEvents(func) {
    this.bindCodemirrorEvents();
    this.bindCustomEvents(func);
  },

  bindCodemirrorEvents() {
    this.editor.on('change', (instance, changeObj) => {
      if (changeObj.origin !== 'setValue') {
        window.dispatchEvent(
          new CustomEvent('userChangedMarkup')
        );
      }
    });

    this.editor.on('beforeSelectionChange', (instance, obj) => {
      if (obj.origin !== undefined) {
        obj.update(obj.ranges);
        const cursorPosition = obj.ranges[0].anchor;
        const index = this.markupDoc.indexFromPos(cursorPosition);
        window.dispatchEvent(
          new CustomEvent('userChangedEditorSelection', { detail: index })
        );
      }
    });
  },

  bindCustomEvents(func) {
    window.addEventListener('userChangedMarkup', event => {
      console.log('user changed markup');

      func({
        source: this.name,
        type: 'userChangedMarkup',
        value: this.editor.getValue(),
      });
    });

    window.addEventListener('userChangedEditorSelection', event => {
      console.log('user changed selection');

      func({
        source: this.name,
        type: 'userChangedEditorSelection',
        index: event.detail,
      });
    });
  },

  react(state) {
    // clear text marker
    if (this.textMarker) {
      this.textMarker.clear();
    }

    // update document value
    if (this.previousSyntaxTree.toMarkup() !== state.syntaxTree.toMarkup()) {
      this.ignoreCursor = true;
      const cursor = this.markupDoc.getCursor();
      this.markupDoc.setValue(state.syntaxTree.toMarkup());
      this.markupDoc.setCursor(cursor);
      this.ignoreCursor = false;
    }

    // set text marker
    const node = state.syntaxTree.findNodeByClassName('selected');
    if (node) {
      const from = this.editor.doc.posFromIndex(node.start);
      const to = this.editor.doc.posFromIndex(node.end + 1);
      const range = [from, to];
      this.textMarker = this.markupDoc.markText(
        ...range, { className: 'selected-markup' }
      );
    }

    // store syntax tree received
    this.previousSyntaxTree = state.syntaxTree;
  },
};

export { editor };

// const anchor = this.markupDoc.getCursor('anchor');
// const head = this.markupDoc.getCursor('head');
// this.markupDoc.setSelection(anchor, head);

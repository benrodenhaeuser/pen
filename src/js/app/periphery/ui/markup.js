import { CodeMirror } from '/vendor/codemirror/codemirror.js';

const markup = {
  init(snapshot) {
    this.name = 'markup';
    this.mountPoint = document.querySelector(`#markup`);
    this.markupEditor = CodeMirror(this.mountPoint, {
      lineNumbers: true,
      lineWrapping: true,
      mode: 'xml',
      value: snapshot.syntaxTree.toMarkup(),
    });
    this.markupDoc = this.markupEditor.getDoc();
    this.previousSyntaxTree = snapshot.syntaxTree;

    return this;
  },

  bindEvents(func) {
    this.bindCodemirrorEvents();
    this.bindCustomEvents(func);
  },

  bindCodemirrorEvents() {
    // identified "user changed markup" events
    this.markupEditor.on('change', (instance, changeObj) => {
      if (changeObj.origin !== 'setValue') {
        window.dispatchEvent(new CustomEvent('userChangedMarkup'));
      }
    });

    // identify "user moved markup selection"
    this.markupEditor.on('beforeSelectionChange', (instance, obj) => {
      if (obj.origin !== undefined) {
        obj.update(obj.ranges);
        const cursorPosition = obj.ranges[0].anchor;
        const index = this.markupDoc.indexFromPos(cursorPosition);
        window.dispatchEvent(
          new CustomEvent('userMovedMarkupSelection', { detail: index })
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
        value: this.markupEditor.getValue(), // current editor value
      });
    });

    window.addEventListener('userMovedMarkupSelection', event => {
      console.log('user changed selection');

      func({
        source: this.name,
        type: 'userMovedMarkupSelection',
        index: event.detail, // index of selection
      });
    });
  },

  react(snapshot) {
    // clear text marker
    if (this.textMarker) {
      this.textMarker.clear();
    }

    // update document value
    if (this.previousSyntaxTree.toMarkup() !== snapshot.syntaxTree.toMarkup()) {
      this.ignoreCursor = true;
      const cursor = this.markupDoc.getCursor();
      this.markupDoc.setValue(snapshot.syntaxTree.toMarkup());
      this.markupDoc.setCursor(cursor);
      this.ignoreCursor = false;
    }

    // set text marker
    const node = snapshot.syntaxTree.findDescendantByClass('selected');
    if (node) {
      const from = this.markupEditor.doc.posFromIndex(node.start);
      const to = this.markupEditor.doc.posFromIndex(node.end + 1);
      const range = [from, to];
      this.textMarker = this.markupDoc.markText(...range, {
        className: 'selected-markup', // triggers CSS rule
      });
    }

    // editor syntax tree received
    this.previousSyntaxTree = snapshot.syntaxTree;
  },
};

export { markup };

// const anchor = this.markupDoc.getCursor('anchor');
// const head = this.markupDoc.getCursor('head');
// this.markupDoc.setSelection(anchor, head);
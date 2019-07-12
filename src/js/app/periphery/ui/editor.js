import { CodeMirror } from '/vendor/codemirror/codemirror.js';

const editor = {
  init(state) {
    this.name       = 'editor';
    this.mountPoint = document.querySelector(`#editor`);
    this.editor     = CodeMirror(this.mountPoint, {
      lineNumbers:  true,
      lineWrapping: true,
      tabSize:      2,
      mode:         'xml',
      value:        state.ast.prettyMarkup(),
    });

    this.previousMarkup = state.ast.prettyMarkup();

    return this;
  },

  bindEvents(func) {
    this.editor.on('focus', () => {
      if (this.textMarker) {
        this.textMarker.clear();
      }
    });

    this.editor.on('change', () => {
      if (this.editor.hasFocus()) {
        func({
          source: this.name,
          type:   'input',
          value:  this.editor.getValue(),
        });
      } else {
      }
    });

    this.editor.on('cursorActivity', () => {
      const cursorPosition = this.editor.getDoc().getCursor();
      const index = this.editor.getDoc().indexFromPos(cursorPosition);

      // an index of 0 is an indication that the event was fired by programmatic insertion
      if (index === 0) {
        return;
      }

      const cleanIndex = this.cleanIndex(index);
      const astNode = this.ast.findNodeByIndex(cleanIndex);
      const token = this.editor.getTokenAt(cursorPosition);

      // if the canvas is empty due to irregular markup, we will not find an ast node
      // so let's make sure we have one before generating an input ...
      if (astNode) {
        func({
          source: this.name,
          type: 'cursorSelect',
          key: astNode.key,
        });
      }
    });
  },

  react(state) {
    this.ast = state.ast;

    if (['penMode', 'selectMode'].includes(state.label)) {
      const currentMarkup  = state.ast.prettyMarkup();
      const previousMarkup = this.previousMarkup;

      // we don't touch the editor if it has focus
      if (!this.editor.hasFocus() && currentMarkup !== previousMarkup) {
        // replace by proper diffing
        this.editor.getDoc().setValue(currentMarkup);
        this.markChange(state);
      }

      this.previousMarkup = state.ast.prettyMarkup();
    }
  },

  reconcile(oldANode, newANode, value) {
    if (newANode.markup) {
      if (oldANode.markup !== newANode.markup) {
        // we need the in-editor range to be able to replace
        //
      } else {
      }
    }
  },

  markChange(state) {
    this.currentMarkup = state.ast.prettyMarkup();
    const indices      = this.diffMarkup(state);

    if (indices !== undefined) {
      const range     = this.convertToRange(indices);
      this.textMarker = this.editor.doc.markText(...range, { className: 'mark' });
    }
  },

  diffMarkup(state) {
    const currentLength  = this.currentMarkup.length;
    const previousLength = this.previousMarkup.length;

    // idea: if markup has been removed, there will be no text to be marked
    if (previousLength > currentLength) {
      return undefined;
    }

    let start;  // beginning of inserted slice of text
    let end;    // end of inserted slice of text

    for (let i = 0; i < currentLength; i += 1) {
      if (this.currentMarkup[i] !== this.previousMarkup[i]) {
        start = i;
        break;
      }
    }

    let k = previousLength - 1;

    for (let j = currentLength - 1; j >= 0; j -= 1) {
      if (this.currentMarkup[j] !== this.previousMarkup[k]) {
        end = j;
        break;
      }

      k -= 1;
    }

    return [start, end];
  },

  convertToRange(indices) {
    const from = this.editor.doc.posFromIndex(indices[0]);
    const to   = this.editor.doc.posFromIndex(indices[1] + 2);

    return [from, to];
  },

  cleanIndex(index) {
    const value = this.editor.getDoc().getValue();
    const left = value.slice(0, index); // everything *before*
    let cleanLeft = left.replace(/\n/g, '');      // eliminate new lines
    cleanLeft = cleanLeft.replace(/>[^<>]+</g, '><'); // eliminate anything not in tags

    const removedCount = left.length - cleanLeft.length; // how much did we remove?
    return index - removedCount;
  },
};

export { editor };

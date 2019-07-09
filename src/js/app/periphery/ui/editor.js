import { CodeMirror } from '/vendor/codemirror/codemirror.js';

const editor = {
  init(state) {
    this.name       = 'editor';
    this.mountPoint = document.querySelector(`#editor`);
    this.editor     = CodeMirror(this.mountPoint, {
      lineNumbers:  true,
      lineWrapping: true,
      // mode:         null,
      mode:         'xml',
      value:        state.vDOM['editor'], // TODO: use ast (do we have an ast?)
    });

    this.previousMarkup = state.vDOM['editor']; // TODO: use ast (do we have an ast?)

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
      const cleanIndex = this.cleanIndex(index);
      // console.log(index, cleanIndex);
      // console.log(this.ast.printIndices());
      const astNode = this.ast.findNodeByIndex(cleanIndex);
      // console.log(astNode);
      const token = this.editor.getTokenAt(cursorPosition);
      // console.log(token.string);

      if (index > 0) {
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
    // console.log('editor received', state.ast);
    // console.log(state.ast.flatten());
    // console.log(state.ast.findNodeByIndex(100));

    if (['penMode', 'selectMode'].includes(state.label)) {
      const currentMarkup  = state.vDOM['editor']; // TODO: use ast
      const previousMarkup = this.previousMarkup;

      if (!this.editor.hasFocus() && currentMarkup !== previousMarkup) {
        this.editor.getDoc().setValue(currentMarkup);
        this.markChange(state);
      }

      this.previousMarkup = state.vDOM['editor'];
    }
  },

  markChange(state) {
    this.currentMarkup = state.vDOM['editor'];
    const indices      = this.diffMarkup(state);

    if (indices !== undefined) {
      const stripped  = this.stripWhitespace(indices);
      const range     = this.convertToRange(stripped);
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

  stripWhitespace(indices) {
    // TODO: zoom in on the subinterval of [start, end] such that neither start nor end
    // are whitespace characters

    return indices;
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
    cleanLeft = cleanLeft.replace(/>[^<>]+</g, '><'); // eliminate whitespace between tags

    // ^ greedy!

    // console.log(left);
    // console.log(cleanLeft);

    const removedCount = left.length - cleanLeft.length; // how much did we remove?
    return index - removedCount;
  },
};

export { editor };

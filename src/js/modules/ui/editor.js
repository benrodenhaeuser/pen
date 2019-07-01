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
      value:        state.vDOM['editor'],
    });

    this.previousMarkup = state.vDOM['editor'];

    return this;
  },

  bindEvents(func) {
    this.editor.on('focus', () => {
      this.textMarker.clear();
    })

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
  },

  react(state) {
    // TODO: release and releasePen are not enough! (e.g., undo)
    if (['release', 'releasePen'].includes(state.update)) {
      const currentMarkup  = state.vDOM['editor'];
      const previousMarkup = this.previousMarkup;

      // first conjunct of inner conditionals follows from outer conditional
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
};

export { editor };

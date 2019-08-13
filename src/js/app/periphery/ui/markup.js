import { CodeMirror } from '/vendor/codemirror/codemirror.js';
import { DiffMatchPatch } from '/vendor/diff-match-patch/diff-match-patch.js';

const markup = {
  init(snapshot) {
    this.name = 'markup';
    this.mountPoint = document.querySelector(`#markup`);
    this.markupEditor = CodeMirror(this.mountPoint, {
      lineNumbers: true,
      lineWrapping: true,
      mode: 'xml',
      value: snapshot.markupTree.toMarkup(),
    });
    this.markupDoc = this.markupEditor.getDoc();
    this.previousMarkupTree = snapshot.markupTree;

    return this;
  },

  bindEvents(func) {
    this.bindCodemirrorEvents();
    this.bindCustomEvents(func);
  },

  bindCodemirrorEvents() {
    this.markupEditor.on('change', (instance, obj) => {
      if (obj.origin !== 'reconcile') {
        window.dispatchEvent(new CustomEvent('userChangedMarkup'));
      }
    });

    this.markupEditor.on('beforeSelectionChange', (instance, obj) => {
      if (obj.origin !== undefined) {
        obj.update(obj.ranges);
        const cursorPosition = obj.ranges[0].anchor;
        const index = this.markupDoc.indexFromPos(cursorPosition);

        if (index) {
          window.dispatchEvent(
            new CustomEvent('userSelectedIndex', { detail: index })
          );
        }
      }
    });
  },

  bindCustomEvents(func) {
    window.addEventListener('userChangedMarkup', event => {
      func({
        source: this.name,
        type: 'userChangedMarkup',
        value: this.markupEditor.getValue(),
      });
    });

    window.addEventListener('userSelectedIndex', event => {
      const node = this.previousMarkupTree.findLeafByIndex(event.detail);

      if (node) {
        func({
          source: this.name,
          type: 'userSelectedMarkupNode',
          key: node.key, // note that we are only interested in the key
        });
      }
    });
  },

  react(snapshot) {
    // optimization: don't handle text markers during animation
    if (snapshot.input.type !== 'mousemove') {
      this.clearTextMarker();
    }

    if (this.previousMarkupTree.toMarkup() !== snapshot.markupTree.toMarkup()) {
      this.reconcile(snapshot);
    }

    // optimization: don't handle text markers during animation
    if (snapshot.input.type !== 'mousemove') {
      this.placeTextMarker(snapshot);
    }

    this.previousMarkupTree = snapshot.markupTree;
  },

  reconcile(snapshot) {
    this.patchLines(
      this.diffLines(this.markupDoc.getValue(), snapshot.markupTree.toMarkup())
    );
  },

  diffLines(text1, text2) {
    const dmp = new DiffMatchPatch();
    const a = dmp.diff_linesToChars_(text1, text2);
    const lineText1 = a.chars1;
    const lineText2 = a.chars2;
    const lineArray = a.lineArray;
    const diffs = dmp.diff_main(lineText1, lineText2, false);
    dmp.diff_charsToLines_(diffs, lineArray);
    return diffs;
  },

  patchLines(diffs) {
    let currentLine = 0;
    let i = 0;

    while (i < diffs.length) {
      const diff = diffs[i];
      const instruction = diff[0];
      const text = diff[1];

      switch (instruction) {
        case 0:
          currentLine += this.countLines(diff);
          i += 1;
          break;
        case -1:
          const nextDiff = diffs[i + 1];

          if (nextDiff) {
            const nextInstruction = nextDiff[0];
            const nextText = nextDiff[1];

            if (nextInstruction === 1) {
              // optimization: replace line instead of delete and insert where possible
              this.replaceLines(currentLine, this.countLines(diff), nextText);
              currentLine += this.countLines(nextDiff);
              i += 2;
            }
          } else {
            this.deleteLines(currentLine, this.countLines(diff));
            i += 1;
          }

          break;
        case 1:
          this.insertLines(currentLine, text);
          currentLine += this.countLines(diff);
          i += 1;
      }
    }
  },

  countLines(diff) {
    return diff[1].match(/\n/g).length;
  },

  deleteLines(lineNumber, linesCount) {
    const startLine = lineNumber;
    const endLine = lineNumber + linesCount;

    this.markupDoc.replaceRange(
      '',
      { line: startLine, ch: 0 },
      { line: endLine, ch: 0 },
      'reconcile'
    );
  },

  insertLines(lineNumber, text) {
    this.markupDoc.replaceRange(
      text,
      { line: lineNumber, ch: 0 },
      { line: lineNumber, ch: 0 }, // "to = from" means "insert"
      'reconcile'
    );
  },

  replaceLines(lineNumber, linesCount, text) {
    const startLine = lineNumber;
    const endLine = lineNumber + linesCount;

    // TODO: we could run another diff to replace in a more targeted manner
    // (rather than replacing the whole line, replace only the part that has changed)

    this.markupDoc.replaceRange(
      text,
      { line: startLine, ch: 0 },
      { line: endLine, ch: 0 },
      'reconcile'
    );
  },

  placeTextMarker(snapshot) {
    let cssClass;

    let node = snapshot.markupTree.findDescendantByClass('selected');
    if (node) {
      cssClass = 'selected-markup';
      this.setMarker(node, cssClass);
    } else {
      node = snapshot.markupTree.findDescendantByClass('tip');
      if (node) {
        cssClass = 'tip-markup';
        this.setMarker(node, cssClass);
      }
    }
  },

  setMarker(node, cssClass) {
    const from = this.markupEditor.doc.posFromIndex(node.start);
    const to = this.markupEditor.doc.posFromIndex(node.end + 1);
    const range = [from, to];
    this.textMarker = this.markupDoc.markText(...range, {
      className: cssClass,
    });
  },

  clearTextMarker() {
    if (this.textMarker) {
      this.textMarker.clear();
    }
  },
};

export { markup };

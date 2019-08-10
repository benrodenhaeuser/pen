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
      console.log('user changed markup');

      func({
        source: this.name,
        type: 'userChangedMarkup',
        value: this.markupEditor.getValue(),
      });
    });

    window.addEventListener('userSelectedIndex', event => {
      console.log('user selected markup node');

      const node = this.previousMarkupTree.findLeafByIndex(event.detail);

      if (node) {
        func({
          source: this.name,
          type: 'userSelectedMarkupNode',
          key: node.key,
        });
      }
    });
  },

  react(snapshot) {
    this.clearTextMarker();

    if (this.previousMarkupTree.toMarkup() !== snapshot.markupTree.toMarkup()) {
      this.reconcile(snapshot);

      // TODO: manage cursor position
    }

    this.placeTextMarker(snapshot);
    this.previousMarkupTree = snapshot.markupTree;
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
    this.textMarker =
      this.markupDoc.markText(...range, {
        className: cssClass,
      });
  },

  clearTextMarker() {
    if (this.textMarker) {
      this.textMarker.clear();
    }
  },

  reconcile(snapshot) {
    this.patchLines(
      this.diffLines(
        this.markupDoc.getValue(),
        snapshot.markupTree.toMarkup()
      )
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

    for (let diff of diffs) {
      const instruction = diff[0];
      const text = diff[1];

      if (instruction === 0) {
        currentLine += this.countLines(diff);
      } else if (instruction === -1) {
        this.deleteLines(currentLine, this.countLines(diff));
      } else if (instruction === 1) {
        this.insertLines(currentLine, text);
        currentLine += this.countLines(diff);
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
};

export { markup };

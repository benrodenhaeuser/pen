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
    this.markupEditor.on('change', (instance, changeObj) => {
      if (!this.updating) {
        window.dispatchEvent(new CustomEvent('userChangedMarkup'));
      }
    });

    this.markupEditor.on('beforeSelectionChange', (instance, obj) => {
      if (obj.origin !== undefined) {
        obj.update(obj.ranges);
        const cursorPosition = obj.ranges[0].anchor;
        const index = this.markupDoc.indexFromPos(cursorPosition);
        const node = this.previousSyntaxTree.findNodeByIndex(event.detail);

        if (node) {
          window.dispatchEvent(
            new CustomEvent('userSelectedMarkupNode', { detail: index })
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
        value: this.markupEditor.getValue(), // current editor value
      });
    });

    window.addEventListener('userSelectedMarkupNode', event => {
      console.log('user selected markup node');

      const node = this.previousSyntaxTree.findNodeByIndex(event.detail);

      if (node) {
        func({
          source: this.name,
          type: 'userSelectedMarkupNode',
          key: node.key, // key of node selected in markup
        });
      }
    });
  },

  react(snapshot) {
    // clear text marker
    if (this.textMarker) {
      this.textMarker.clear();
    }

    // patch document
    if (this.previousSyntaxTree.toMarkup() !== snapshot.syntaxTree.toMarkup()) {
      this.updating = true;

      this.patchLines(
        this.diffLines(
          this.previousSyntaxTree.toMarkup(),
          snapshot.syntaxTree.toMarkup()
        )
      );

      this.updating = false;

      // presumably, we will not need this anymore?
      // this.ignoreCursor = true;
      // const cursor = this.markupDoc.getCursor();
      // this.markupDoc.setValue(snapshot.syntaxTree.toMarkup());
      // this.markupDoc.setCursor(cursor);
      // this.ignoreCursor = false;
    }

    // set text marker --> TODO need to update this code:
    // const node = snapshot.syntaxTree.findDescendantByClass('selected');
    // if (node) {
    //   const from = this.markupEditor.doc.posFromIndex(node.start);
    //   const to = this.markupEditor.doc.posFromIndex(node.end + 1);
    //   const range = [from, to];
    //   this.textMarker = this.markupDoc.markText(...range, {
    //     className: 'selected-markup', // triggers CSS rule
    //   });
    // }

    this.previousSyntaxTree = snapshot.syntaxTree;
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
      { line: endLine, ch: 0 }
    );
  },

  insertLines(lineNumber, text) {
    this.markupDoc.replaceRange(
      text,
      { line: lineNumber, ch: 0 }
    );
  },
};

export { markup };

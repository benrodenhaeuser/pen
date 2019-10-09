import { CodeMirror } from '/vendor/codemirror/codemirror.js';
import { DiffMatchPatch } from '/vendor/diff-match-patch/diff-match-patch.js';

const markup = {
  init() {
    this.name = 'markup';
    this.mountPoint = document.querySelector(`#markup`);

    const markupTree = this.requestSnapshot('markupTree');

    this.markupEditor = CodeMirror(this.mountPoint, {
      lineNumbers: true,
      lineWrapping: false,
      mode: 'xml',
      value: markupTree.toMarkupString(),
      theme: 'pen',
    });
    this.markupDoc = this.markupEditor.getDoc();
    this.previousMarkupTree = markupTree;

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

        if (cursorPosition) {
          window.dispatchEvent(
            new CustomEvent('userSelectedPosition', { detail: cursorPosition })
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

    window.addEventListener('userSelectedPosition', event => {
      const node = this.previousMarkupTree.findTokenByPosition(event.detail);

      if (node) {
        func({
          source: this.name,
          type: 'userSelectedMarkupNode',
          key: node.key, // note that we are only interested in the key!
        });
      }
    });
  },

  react(description) {
    // if (
    //   description.input.type !== 'mousemove' &&
    //   description.input.type !== 'mousedown'
    // ) {
      this.clearTextMarker();

      const markupTree = this.requestSnapshot('markupTree');

      if (
        this.previousMarkupTree.toMarkupString() !== markupTree.toMarkupString()
      ) {
        this.reconcile(markupTree);
      }

      this.placeTextMarker(markupTree);
      this.previousMarkupTree = markupTree;
    // }
  },

  reconcile(markupTree) {
    this.patch(
      this.diff(this.markupDoc.getValue(), markupTree.toMarkupString())
    );
  },

  diff(text1, text2) {
    const dmp = new DiffMatchPatch();
    const a = dmp.diff_linesToChars_(text1, text2);
    const lineText1 = a.chars1;
    const lineText2 = a.chars2;
    const lineArray = a.lineArray;
    const diffs = dmp.diff_main(lineText1, lineText2, false);
    dmp.diff_charsToLines_(diffs, lineArray);
    return diffs;
  },

  patch(diffs) {
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
          const nextInstruction = nextDiff && nextDiff[0];
          const nextText = nextDiff && nextDiff[1];

          if (nextInstruction === 1) {
            // optimization: replace line instead of delete + insert whwnever possible
            this.replaceLines(currentLine, this.countLines(diff), nextText);
            currentLine += this.countLines(nextDiff);
            i += 2;
          } else {
            this.deleteLines(currentLine, this.countLines(diff));
            i += 1;
          }

          break;
        case 1:
          this.insertLines(currentLine, text);
          currentLine += this.countLines(diff);
          i += 1;

          break;
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
      { line: lineNumber, ch: 0 },
      'reconcile'
    );
  },

  replaceLines(lineNumber, linesCount, text) {
    const startLine = lineNumber;
    const endLine = lineNumber + linesCount;

    this.markupDoc.replaceRange(
      text,
      { line: startLine, ch: 0 },
      { line: endLine, ch: 0 },
      'reconcile'
    );
  },

  placeTextMarker(markupTree) {
    let cssClass;

    let node = markupTree.findDescendantByClass('selected');

    if (node) {
      cssClass = 'selected-markup';
      this.setMarker(node, cssClass);
    } else {
      node = markupTree.findDescendantByClass('tip');
      if (node) {
        cssClass = 'tip-markup';
        this.setMarker(node, cssClass);
      }
    }
  },

  setMarker(node, cssClass) {
    const markerRange = node.getRange();
    const scrollTarget = { line: markerRange[0].line, ch: 0 };
    // ^ TODO: just an approximation
    this.markupEditor.scrollIntoView(scrollTarget);
    this.textMarker = this.markupDoc.markText(...markerRange, {
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

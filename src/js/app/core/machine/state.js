import { Editor } from '../domain/_.js';
import { Docs } from '../domain/_.js';
import { Doc } from '../domain/_.js';
import { Message } from '../domain/_.js';
import { Canvas } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';
import { MarkupNode } from '../domain/_.js';

import { editorToVDOM } from '../ports/_.js';
import { markupToScene } from '../ports/_.js';
import { objectToDoc } from '../ports/_.js';
import { markupToDOM } from '../ports/_.js';
import { domToScene } from '../ports/_.js';
import { domToSyntaxTree } from '../ports/_.js';
import { sceneToSyntaxTree } from '../ports/_.js';

const State = {
  create() {
    return Object.create(State).init();
  },

  init() {
    this.label = 'start';
    this.input = {};
    this.update = '';
    this.editor = this.buildEditorTree();

    return this;
  },

  buildEditorTree() {
    const editor = Editor.create();
    const doc = this.buildDoc();
    const docs = Docs.create();
    const message = this.buildMessage();

    editor.append(doc);
    editor.append(docs);
    editor.append(message);

    return editor;
  },

  buildMessage() {
    const message = Message.create();
    message.text = 'Welcome!';
    return message;
  },

  buildDoc() {
    const doc = Doc.create();

    const canvas = Canvas.create();
    canvas.viewBox = Rectangle.createFromDimensions(0, 0, 600, 395);
    doc.append(canvas);

    const syntaxTree = MarkupNode.create();
    doc.append(syntaxTree);

    return doc;
  },

  editorToVDOM() {
    return editorToVDOM(this.editor);
  },

  editorToPlain() {
    return {
      doc: JSON.parse(JSON.stringify(this.doc)),
    };
  },

  objectToDoc(object) {
    return objectToDoc(object);
  },

  markupToDOM(markup) {
    return markupToDOM(markup);
  },

  domToScene($svg) {
    return domToScene($svg);
  },

  domToSyntaxTree($svg) {
    return domToSyntaxTree($svg);
  },

  sceneToSyntaxTree() {
    return sceneToSyntaxTree(this.editor.canvas);
  },

  markupToScene(markup) {
    return markupToScene(markup);
  },
};

Object.defineProperty(State, 'snapshot', {
  get() {
    return {
      label: this.label,
      input: this.input,
      update: this.update,
      vDOM: this.editorToVDOM(),
      plain: this.editorToPlain(),
      syntaxTree: this.syntaxTree,
    };
  },
});

Object.defineProperty(State, 'canvas', {
  get() {
    return this.editor.canvas;
  },
});

Object.defineProperty(State, 'syntaxTree', {
  get() {
    return this.editor.syntaxTree;
  },
});

Object.defineProperty(State, 'doc', {
  get() {
    return this.editor.doc;
  },
});

Object.defineProperty(State, 'docs', {
  get() {
    return this.editor.docs;
  },
});

Object.defineProperty(State, 'message', {
  get() {
    return this.editor.message;
  },
});

export { State };

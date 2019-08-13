import { Editor } from '../domain/_.js';
import { Docs } from '../domain/_.js';
import { Doc } from '../domain/_.js';
import { Message } from '../domain/_.js';
import { Canvas } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';

import { docToObject } from '../ports/_.js';
import { objectToDoc } from '../ports/_.js';
import { markupToCanvas } from '../ports/_.js';
import { canvasToMarkupTree } from '../ports/_.js';
import { editorToVDOM } from '../ports/_.js';

const State = {
  create() {
    return Object.create(State).init();
  },

  init() {
    this.label = 'start';
    this.input = {};
    this.update = '';
    this.aux = {};

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
    canvas.viewBox = Rectangle.createFromDimensions(0, 0, 700, 700);
    doc.append(canvas);

    return doc;
  },

  editorToVDOM() {
    return editorToVDOM(this.editor);
  },

  docToObject() {
    return docToObject(this.doc);
  },

  objectToDoc(object) {
    return objectToDoc(object);
  },

  markupToCanvas(markup) {
    return markupToCanvas(markup);
  },

  canvasToMarkupTree() {
    return canvasToMarkupTree(this.editor.canvas);
  },
};

Object.defineProperty(State, 'snapshot', {
  get() {
    const snapshot = {
      label: this.label,
      input: this.input,
      update: this.update,
      vDOM: this.editorToVDOM(),
      // plain: this.docToObject(), // TODO: should be requested by db
      markupTree: this.canvasToMarkupTree(), // TODO: avoid
    };

    return snapshot;
  },
});

Object.defineProperty(State, 'canvas', {
  get() {
    return this.editor.canvas;
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

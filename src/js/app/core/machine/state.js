import { Editor } from '../domain/_.js';
import { Docs } from '../domain/_.js';
import { Doc } from '../domain/_.js';
import { Message } from '../domain/_.js';
import { Canvas } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';

import { comps } from '../domain/_.js';
import { docToObject } from '../ports/_.js';
import { objectToDoc } from '../ports/_.js';
import { markupToCanvas } from '../ports/_.js';

const State = {
  create() {
    return Object.create(State).init();
  },

  init() {
    this.label = 'start';
    this.input = {};
    this.update = '';
    this.aux = {};
    this.snapshots = {};

    this.editor = this.buildEditorTree();

    return this;
  },

  buildEditorTree() {
    const editor = Editor.create();
    const doc = this.buildDoc();
    const docs = Docs.create();
    const message = this.buildMessage();

    editor.mount(doc);
    editor.mount(docs);
    editor.mount(message);

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
    doc.mount(canvas);

    return doc;
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

  snapshot(label) {
    if (this.snapshots[label]) {
      return this.snapshots[label];
    }

    // TODO: clean up the structure?
    switch (label) {
      case 'vDOM':
        return (this.snapshots['vDOM'] = {
          tools: comps.tools(this.editor),
          message: this.editor.message.text,
          canvas: this.canvas.renderElement(),
        });
      case 'plain':
        return (this.snapshots['plain'] = this.docToObject());
      case 'markupTree':
        return (this.snapshots['markupTree'] = this.canvas.renderTags());
    }
  },
};

Object.defineProperty(State, 'info', {
  get() {
    return {
      label: this.label,
      input: this.input,
      update: this.update,
    };
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

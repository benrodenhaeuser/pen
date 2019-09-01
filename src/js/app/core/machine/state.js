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
  create(canvasWidth) {
    return Object.create(State).init(canvasWidth);
  },

  init(canvasWidth) {
    this.description = {
      mode: 'start',
      label: '',
      input: {},
      update: '',
      layout: {
        menuVisible: false,
      }
    };

    this.temp = {};
    this.snapshots = {};

    this.editor = this.buildEditorTree(canvasWidth);

    return this;
  },

  buildEditorTree(canvasWidth) {
    const editor = Editor.create();
    const doc = this.buildDoc(canvasWidth);
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

  buildDoc(canvasWidth) {
    const doc = Doc.create({ canvasWidth: canvasWidth });

    const canvas = Canvas.create();
    canvas.viewBox = Rectangle.createFromDimensions(0, 0, 800, 1600);
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

    // TODO: clean up the structure
    switch (label) {
      case 'vDOM':
        return (this.snapshots['vDOM'] = {
          tools: comps.tools(this.editor),
          menu: comps.menu(this.editor),
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

Object.defineProperty(State, 'mode', {
  get() {
    return this.description.mode;
  },

  set(value) {
    this.description.mode = value;
  },
});

Object.defineProperty(State, 'label', {
  get() {
    return this.description.label;
  },

  set(value) {
    this.description.label = value;
  },
});

Object.defineProperty(State, 'input', {
  get() {
    return this.description.input;
  },

  set(value) {
    this.description.input = value;
  },
});

Object.defineProperty(State, 'update', {
  get() {
    return this.description.update;
  },

  set(value) {
    this.description.update = value;
  },
});

Object.defineProperty(State, 'layout', {
  get() {
    return this.description.layout;
  },

  set(value) {
    this.description.layout = value;
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

Object.defineProperty(State, 'target', {
  get() {
    return this.temp.target;
  },

  set(value) {
    this.temp.target = value;
  },
});

Object.defineProperty(State, 'from', {
  get() {
    return this.temp.from;
  },

  set(value) {
    this.temp.from = value;
  },
});

export { State };

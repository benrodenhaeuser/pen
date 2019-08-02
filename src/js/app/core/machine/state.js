import { Store } from '../domain/_.js';
import { Docs } from '../domain/_.js';
import { Doc } from '../domain/_.js';
import { Message } from '../domain/_.js';
import { Canvas } from '../domain/_.js';
import { Rectangle } from '../domain/_.js';
import { MarkupNode } from '../domain/_.js';

import { exportToSVG } from '../ports/_.js';
import { exportToVDOM } from '../ports/_.js';
import { exportToPlain } from '../ports/_.js';
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
    this.store = this.buildStore();

    return this;
  },

  buildStore() {
    const store = Store.create();
    const docs = Docs.create();
    const message = this.buildMessage();
    const doc = this.buildDoc();

    store.append(docs);
    store.append(doc);
    store.append(message);

    return store;
  },

  buildMessage() {
    const message = Message.create();
    message.payload.text = 'Welcome!';
    return message;
  },

  buildDoc() {
    const doc = Doc.create();

    const canvas = Canvas.create();
    canvas.viewBox = Rectangle.createFromDimensions(0, 0, 600, 395);
    // ^ TODO this is not in the right place.
    doc.append(canvas);

    const syntaxTree = MarkupNode.create();
    doc.append(syntaxTree);

    return doc;
  },

  export() {
    return {
      label: this.label,
      input: this.input,
      update: this.update,
      vDOM: this.exportToVDOM(),
      plain: this.exportToPlain(),
      syntaxTree: this.syntaxTree,
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
    return sceneToSyntaxTree(this.store.canvas);
  },

  // returns a Canvas node
  markupToScene(markup) {
    return markupToScene(markup);
  },

  exportToSVG() {
    return exportToSVG(this.store);
  },

  // TODO: weird - returns a Doc node and a list of ids (for docs)
  exportToVDOM() {
    return exportToVDOM(this);
  },

  // returns a plain representation of Doc node and a list of ids (for docs)
  exportToPlain() {
    return exportToPlain(this.store);
  },
};

Object.defineProperty(State, 'canvas', {
  get() {
    return this.store.canvas;
  },
});

Object.defineProperty(State, 'syntaxTree', {
  get() {
    return this.store.syntaxTree;
  },
});

Object.defineProperty(State, 'doc', {
  get() {
    return this.store.doc;
  },
});

Object.defineProperty(State, 'docs', {
  get() {
    return this.store.docs;
  },
});

Object.defineProperty(State, 'message', {
  get() {
    return this.store.message;
  },
});

export { State };

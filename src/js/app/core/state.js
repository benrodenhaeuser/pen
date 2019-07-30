import { exportToSVG } from './ports/dir.js';
import { exportToVDOM } from './ports/dir.js';
import { exportToPlain } from './ports/dir.js';
import { markupToScene } from './ports/dir.js';
import { objectToDoc } from './ports/dir.js';
import { markupToDOM } from './ports/dir.js';
import { domToScene } from './ports/dir.js';
import { domToSyntaxTree } from './ports/dir.js';
import { sceneToSyntaxTree } from './ports/dir.js';

import { Store } from './domain/dir.js';
import { Docs } from './domain/dir.js';
import { Doc } from './domain/dir.js';
import { Message } from './domain/dir.js';
import { Canvas } from './domain/dir.js';
import { Rectangle } from './domain/dir.js';
import { SyntaxTree } from './domain/dir.js';

const State = {
  create() {
    return Object.create(State).init();
  },

  init() {
    this.label = 'start';
    this.input = {};
    this.update = '';
    this.store = this.buildStore();
    this.syntaxTree = SyntaxTree.create(); // TODO: make a part of buildStore

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
    doc.append(canvas);

    return doc;
  },

  get canvas() {
    return this.store.canvas;
  },

  get doc() {
    return this.store.doc;
  },

  get docs() {
    return this.store.docs;
  },

  get message() {
    return this.store.message;
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

  // returns a Doc node and a list of ids (for docs)
  exportToVDOM() {
    return exportToVDOM(this);
  },

  exportToAST() {
    return exportToAST(this);
  },

  // returns a plain representation of Doc node and a list of ids (for docs)
  exportToPlain() {
    return exportToPlain(this.store);
  },
};

export { State };

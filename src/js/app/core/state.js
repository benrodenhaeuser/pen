import { exportToSVG } from './ports/ports.js';
import { exportToVDOM } from './ports/ports.js';
import { exportToPlain } from './ports/ports.js';
import { markupToScene } from './ports/ports.js';
import { objectToDoc } from './ports/ports.js';
import { markupToDOM } from './ports/ports.js';
import { domToScene } from './ports/ports.js';
import { domToSyntaxTree } from './ports/ports.js';
import { sceneToSyntaxTree } from './ports/ports.js';

import { Store } from './domain/domain.js';
import { Docs } from './domain/domain.js';
import { Doc } from './domain/domain.js';
import { Message } from './domain/domain.js';
import { Scene } from './domain/domain.js';
import { Rectangle } from './domain/domain.js';
import { SyntaxTree } from './domain/domain.js';

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
    const scene = Scene.create();
    scene.viewBox = Rectangle.createFromDimensions(0, 0, 600, 395);
    doc.append(scene);

    return doc;
  },

  get scene() {
    return this.store.scene;
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
    return sceneToSyntaxTree(this.store.scene);
  },

  // returns a Scene node
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

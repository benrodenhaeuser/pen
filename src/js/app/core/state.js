import { exportToSVG     } from './ports.js';
import { exportToVDOM    } from './ports.js';
import { exportToAST     } from './ports.js';
import { exportToPlain   } from './ports.js';
import { markupToScene   } from './ports.js';
import { objectToDoc     } from './ports.js';
import { Store           } from './domain.js';
import { Docs            } from './domain.js';
import { Doc             } from './domain.js';
import { Message         } from './domain.js';
import { Scene           } from './domain.js';
import { Markup          } from './domain.js';
import { Rectangle       } from './domain.js';

const State = {
  create() {
    return Object.create(State).init();
  },

  init() {
    this.label  = 'start';
    this.input  = {};
    this.update = '';
    this.store  = this.buildStore();

    return this;
  },

  buildStore() {
    const store   = Store.create();
    const docs    = Docs.create();
    const message = this.buildMessage();
    const doc     = this.buildDoc();

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
    const doc    = Doc.create();
    const scene  = Scene.create();
    const markup = Markup.create();

    const width = this.width || 0;
    const height = this.height || 0;

    scene.viewBox = Rectangle.createFromDimensions(0, 0, 600, 395);

    markup.payload.text = '';

    doc.append(scene);
    doc.append(markup);

    return doc;
  },

  get scene() {
    return this.store.scene;
  },

  get markup() {
    return this.store.markup;
  },

  get doc() {
    return this.store.doc;
  },

  get docs() {
    return this.store.docs;
  },

  export() {
    return {
      label:  this.label,
      input:  this.input,
      update: this.update,
      vDOM:   this.exportToVDOM(),
      plain:  this.exportToPlain(),
      ast:    this.exportToAST(),
    };
  },

  // TODO: better naming, like:
  // objectToScene
  // markupToScene
  // sceneToMarkup
  // sceneToVDOM
  // sceneToAST
  // sceneToObject

  // returns a node (node type may vary depending on object)
  objectToDoc(object) {
    return objectToDoc(object);
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

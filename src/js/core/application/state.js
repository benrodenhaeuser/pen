import { svgImporter   } from './ports.js';
import { svgExporter   } from './ports.js';
import { exportToVDOM  } from './ports.js';
import { exportToAST   } from './ports.js';
import { plainImporter } from './ports.js';
import { plainExporter } from './ports.js';
import { Store         } from './domain/nodes.js';
import { Docs          } from './domain/nodes.js';
import { Doc           } from './domain/nodes.js';
import { Message       } from './domain/nodes.js';
import { Scene         } from './domain/nodes.js';
import { Markup        } from './domain/nodes.js';
import { Rectangle     } from './domain/geometry.js';

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

  // returns a node (node type may vary depending on object)
  importFromPlain(object) {
    return plainImporter.build(object);
  },

  // returns a Scene node
  importFromSVG(markup) {
    return svgImporter.build(markup);
  },

  exportToSVG() {
    return svgExporter.build(this.store);
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
    return plainExporter.build(this.store);
  },
};

export { State };

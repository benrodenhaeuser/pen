import { Store, Docs, Doc, Message, Scene } from '../domain/types.js';
import { Rectangle } from '../domain/rectangle.js';

const fromScratch = {
  build() {
    const store   = Store.create();
    const docs    = Docs.create();
    const doc     = Doc.create();
    const message = Message.create();
    const scene   = Scene.create();
    scene.viewBox = Rectangle.createFromDimensions(0, 0, 1000, 1000); // TODO: placeholder
    // TODO: we need a namespace

    store.append(docs);
    store.append(doc);
    store.append(message);
    doc.append(scene);

    return store;
  },
};

export { fromScratch };

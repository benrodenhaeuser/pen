import { Node } from './dir.js';
import { createID } from '../helpers/dir.js';

const Doc = Object.create(Node);
Doc.type = 'doc';

Object.assign(Doc, {
  create() {
    return Node.create
      .bind(this)()
      .set({ _id: createID() });
  },

  toJSON() {
    const obj = Node.toJSON.bind(this)();
    obj._id = this._id;
    return obj;
  },
});

export { Doc };

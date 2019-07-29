import { Node } from './node.js';
import { createID } from '../helpers/helpers.js';

const Doc = Object.create(Node);
Doc.type = 'doc';

Object.assign(Doc, {
  create() {
    return Node.create
      .bind(this)()
      .set({ _id: createID() });
  },

  toJSON() {
    const plain = Node.toJSON.bind(this)();
    plain._id = this._id;
    return plain;
  },
});

export { Doc };

import { Node } from './_.js';
import { createID } from '../helpers/_.js';

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

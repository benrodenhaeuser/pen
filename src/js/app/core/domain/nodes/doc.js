import { Node } from './_.js';
import { createID } from '../helpers/_.js';

const Doc = Object.create(Node);
Doc.type = 'doc';

Object.assign(Doc, {
  create() {
    return Node.create
      .bind(this)()
      .set({ _id: createID() }); // TODO: why not in payload?
  },

  toJSON() {
    const obj = Node.toJSON.bind(this)();
    obj._id = this._id; // TODO: why not in payload?
    return obj;
  },
});

export { Doc };

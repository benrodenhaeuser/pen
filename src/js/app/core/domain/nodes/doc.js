import { Node } from './_.js';
import { createID } from '../helpers/_.js';

const Doc = Object.create(Node);

Object.assign(Doc, {
  create() {
    return Node.create
      .bind(this)()
      .set({
        type: 'doc',
        _id: createID(),
      });
  },
});

Object.defineProperty(Doc, '_id', {
  get() {
    return this.payload._id;
  },

  set(value) {
    this.payload._id = value;
  },
});

export { Doc };

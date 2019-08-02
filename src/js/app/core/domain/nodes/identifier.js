import { Node } from './_.js';

const Identifier = Object.create(Node);
Identifier.type = 'identifier';

Object.defineProperty(Identifier, '_id', {
  get() {
    return this.payload._id;
  },

  set(value) {
    this.payload._id = value;
  },
});

export { Identifier };

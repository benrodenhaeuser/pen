import { Node } from './_.js';
import { types } from './_.js';

const Docs = Object.create(Node);

Object.assign(Docs, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({ type: types.DOCS })
      .set(opts);
  },
});

export { Docs };

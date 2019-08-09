import { Node } from './_.js';
import { types } from './_.js';

const Identifier = Object.create(Node);
Identifier.defineProps(['_id']);

Object.assign(Identifier, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({ type: types.IDENTIFIER })
      .set(opts);
  },
});

export { Identifier };

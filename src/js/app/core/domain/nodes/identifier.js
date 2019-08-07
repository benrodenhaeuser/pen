import { Node } from './_.js';
import { types } from './_.js';

const Identifier = Object.create(Node);
Identifier.defineProps(['_id']);

Object.assign(Identifier, {
  create() {
    return Node.create
      .bind(this)()
      .set({ type: types.IDENTIFIER });
  },
});

export { Identifier };

import { MarkupNode } from './_.js';
import { types } from './_.js';

const Langle = Object.create(MarkupNode);

Object.assign(Langle, {
  create() {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.LANGLE });
  },
});

export { Langle };

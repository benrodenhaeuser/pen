import { MarkupNode } from './_.js';
import { types } from './_.js';

const Attributes = Object.create(MarkupNode);

Object.assign(Attributes, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.ATTRIBUTES })
      .set(opts);
  },
});

export { Attributes };

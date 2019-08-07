import { MarkupNode } from './_.js';
import { types } from './_.js';

const Attributes = Object.create(MarkupNode);

Object.assign(Attributes, {
  create() {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.ATTRIBUTES });
  },
});

export { Attributes };

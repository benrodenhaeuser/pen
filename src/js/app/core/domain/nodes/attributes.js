import { MarkupNode } from './_.js';
import { types } from './_.js';

const Attributes = Object.create(MarkupNode);

Object.assign(Attributes, {
  create(text) {
    return MarkupNode.create
      .bind(this)(text)
      .set({ type: types.ATTRIBUTES });
  },
});

export { Attributes };
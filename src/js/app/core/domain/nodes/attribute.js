import { MarkupNode } from './_.js';
import { types } from './_.js';

const Attribute = Object.create(MarkupNode);

Object.assign(Attribute, {
  create(text) {
    return MarkupNode.create
      .bind(this)(text)
      .set({ type: types.ATTRIBUTE });
  },
});

export { Attribute };

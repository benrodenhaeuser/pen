import { MarkupNode } from './_.js';
import { types } from './_.js';

const AttrKey = Object.create(MarkupNode);

Object.assign(AttrKey, {
  create(text) {
    return MarkupNode.create
      .bind(this)(text)
      .set({ type: types.ATTRKEY });
  },
});

export { AttrKey };

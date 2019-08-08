import { MarkupNode } from './_.js';
import { types } from './_.js';

const AttrValue = Object.create(MarkupNode);

Object.assign(AttrValue, {
  create(text) {
    return MarkupNode.create
      .bind(this)(text)
      .set({ type: types.ATTRVALUE });
  },
});

export { AttrValue };

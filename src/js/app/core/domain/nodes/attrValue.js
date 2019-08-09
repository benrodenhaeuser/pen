import { MarkupNode } from './_.js';
import { types } from './_.js';

const AttrValue = Object.create(MarkupNode);

Object.assign(AttrValue, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.ATTRVALUE });
  },
});

export { AttrValue };

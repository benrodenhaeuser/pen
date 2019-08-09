import { MarkupNode } from './_.js';
import { types } from './_.js';

const AttrKey = Object.create(MarkupNode);

Object.assign(AttrKey, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.ATTRKEY })
      .set(opts);
  },
});

export { AttrKey };

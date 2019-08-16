import { MarkupNode } from './_.js';
import { types } from './_.js';

const Tag = Object.create(MarkupNode);

Object.assign(Tag, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.TAG })
      .set(opts);
  },
});

export { Tag };

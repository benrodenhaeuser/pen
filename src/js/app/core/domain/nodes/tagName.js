import { MarkupNode } from './_.js';
import { types } from './_.js';

const TagName = Object.create(MarkupNode);

Object.assign(TagName, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.TAGNAME })
      .set(opts);
  },
});

export { TagName };

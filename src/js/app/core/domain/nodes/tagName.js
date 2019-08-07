import { MarkupNode } from './_.js';
import { types } from './_.js';

const TagName = Object.create(MarkupNode);

Object.assign(TagName, {
  create() {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.TagName });
  },
});

export { TagName };

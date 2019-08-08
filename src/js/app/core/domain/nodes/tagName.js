import { MarkupNode } from './_.js';
import { types } from './_.js';

const TagName = Object.create(MarkupNode);

Object.assign(TagName, {
  create(text) {
    return MarkupNode.create
      .bind(this)(text)
      .set({ type: types.TagName });
  },
});

export { TagName };

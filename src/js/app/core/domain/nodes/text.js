import { MarkupNode } from './_.js';
import { types } from './_.js';

const Text = Object.create(MarkupNode);

Object.assign(Text, {
  create(text) {
    return MarkupNode.create
      .bind(this)(text)
      .set({ type: types.TEXT });
  },
});

export { Text };

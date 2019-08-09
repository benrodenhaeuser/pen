import { MarkupNode } from './_.js';
import { types } from './_.js';

const Text = Object.create(MarkupNode);

Object.assign(Text, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.TEXT })
      .set(opts);
  },
});

export { Text };

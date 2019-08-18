import { MarkupNode } from './_.js';
import { types } from './_.js';

const MarkupRoot = Object.create(MarkupNode);

Object.assign(MarkupRoot, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set({ type: types.MARKUPROOT })
      .set(opts);
  },
});

export { MarkupRoot };

import { MarkupNode } from './_.js';
import { types } from './_.js';

const MarkupElement = Object.create(MarkupNode);

Object.assign(MarkupElement, {
  create(opts = {}) {
    return MarkupNode.create
      .bind(this)()
      .set(opts);
  },
});

export { MarkupElement };

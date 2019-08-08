import { MarkupNode } from './_.js';
import { types } from './_.js';

const Tag = Object.create(MarkupNode);

Object.assign(Tag, {
  create(text) {
    return MarkupNode.create.bind(this)(text);
  },
});

export { Tag };

import { MarkupNode } from './_.js';
import { types } from './_.js';

const Tag = Object.create(MarkupNode);

Object.assign(Tag, {
  create() {
    return MarkupNode.create.bind(this)();
  },
});

export { Tag };

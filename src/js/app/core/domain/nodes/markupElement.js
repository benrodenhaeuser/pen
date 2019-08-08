import { MarkupNode } from './_.js';
import { types } from './_.js';

const MarkupElement = Object.create(MarkupNode);

Object.assign(MarkupElement, {
  create() {
    return MarkupNode.create.bind(this)()
  },
});

export { MarkupElement };